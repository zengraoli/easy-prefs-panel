// ===== Fetcher Code Generation =====

export interface FetcherConfig {
  type: "Fetcher" | "StealthyFetcher" | "PlayWrightFetcher";
  url: string;
  headless: boolean;
  disableResources: boolean;
  useProxy: boolean;
  proxyAddress: string;
  timeout: number;
  // StealthyFetcher specific
  blockImages: boolean;
  humanize: boolean;
  // PlayWrightFetcher specific
  disableWebgl: boolean;
  hideCanvas: boolean;
  networkIdle: boolean;
  // Selectors
  selectors: SelectorRule[];
}

export interface SelectorRule {
  name: string;
  type: "css" | "xpath" | "text" | "similar";
  value: string;
  attribute?: string;
}

export function generateFetcherCode(config: FetcherConfig): string {
  const lines: string[] = [];
  const importClass = config.type === "PlayWrightFetcher" ? "PlayWrightFetcher" : config.type;

  lines.push(`from scrapling import ${importClass}`);
  lines.push("");

  // Build fetcher args
  const args: string[] = [];
  if (config.headless === false && config.type !== "Fetcher") {
    args.push("headless=False");
  }
  if (config.disableResources && config.type !== "Fetcher") {
    args.push("disable_resources=True");
  }
  if (config.blockImages && config.type === "StealthyFetcher") {
    args.push("block_images=True");
  }
  if (config.humanize && config.type === "StealthyFetcher") {
    args.push("humanize=True");
  }
  if (config.disableWebgl && config.type === "PlayWrightFetcher") {
    args.push("disable_webgl=True");
  }
  if (config.hideCanvas && config.type === "PlayWrightFetcher") {
    args.push("hide_canvas=True");
  }

  const fetcherInit = args.length > 0
    ? `fetcher = ${importClass}(${args.join(", ")})`
    : `fetcher = ${importClass}()`;
  lines.push(fetcherInit);
  lines.push("");

  // Build fetch args
  const fetchArgs: string[] = [`"${config.url}"`];
  if (config.timeout !== 10) {
    fetchArgs.push(`timeout=${config.timeout}`);
  }
  if (config.useProxy && config.proxyAddress) {
    fetchArgs.push(`proxy={"https": "${config.proxyAddress}"}`);
  }
  if (config.networkIdle && config.type === "PlayWrightFetcher") {
    fetchArgs.push("network_idle=True");
  }

  lines.push(`page = fetcher.fetch(${fetchArgs.join(", ")})`);
  lines.push("");

  // Selectors
  if (config.selectors.length > 0) {
    lines.push("# 数据提取");
    for (const sel of config.selectors) {
      const varName = sel.name || "result";
      if (sel.type === "css") {
        if (sel.attribute) {
          lines.push(`${varName} = page.css("${sel.value}").attrib["${sel.attribute}"]`);
        } else {
          lines.push(`${varName} = page.css("${sel.value}")`);
        }
      } else if (sel.type === "xpath") {
        lines.push(`${varName} = page.xpath("${sel.value}")`);
      } else if (sel.type === "text") {
        lines.push(`${varName} = page.find_by_text("${sel.value}")`);
      } else if (sel.type === "similar") {
        lines.push(`${varName} = page.find_similar(page.css("${sel.value}"))`);
      }
    }
    lines.push("");
  }

  lines.push('print("抓取完成！")');

  return lines.join("\n");
}

// ===== Spider Code Generation =====

export interface SpiderConfig {
  name: string;
  startUrls: string[];
  concurrency: number;
  delay: number;
  maxDepth: number;
  sessionType: "FetcherSession" | "StealthySession" | "DynamicSession";
  selectors: SelectorRule[];
  exportFormat: "json" | "jsonl";
  crawlDir: string;
  respectRobots: boolean;
  devMode: boolean;
}

export function generateSpiderCode(config: SpiderConfig): string {
  const lines: string[] = [];
  
  lines.push("from scrapling import Spider");
  if (config.sessionType !== "FetcherSession") {
    lines.push(`from scrapling.sessions import ${config.sessionType}`);
  }
  lines.push("");

  lines.push(`class ${config.name}(Spider):`);
  
  // Start URLs
  const urlsStr = config.startUrls.map(u => `"${u}"`).join(", ");
  lines.push(`    start_urls = [${urlsStr}]`);
  
  if (config.concurrency !== 1) {
    lines.push(`    concurrency = ${config.concurrency}`);
  }
  if (config.delay !== 0) {
    lines.push(`    download_delay = ${config.delay}`);
  }
  if (config.maxDepth !== 0) {
    lines.push(`    max_depth = ${config.maxDepth}`);
  }
  if (config.crawlDir) {
    lines.push(`    crawl_dir = "${config.crawlDir}"`);
  }
  if (config.respectRobots) {
    lines.push("    respect_robots_txt = True");
  }
  
  lines.push("");
  lines.push("    def parse(self, page):");
  
  if (config.selectors.length > 0) {
    for (const sel of config.selectors) {
      const varName = sel.name || "data";
      if (sel.type === "css") {
        lines.push(`        ${varName} = page.css("${sel.value}")`);
      } else if (sel.type === "xpath") {
        lines.push(`        ${varName} = page.xpath("${sel.value}")`);
      } else if (sel.type === "text") {
        lines.push(`        ${varName} = page.find_by_text("${sel.value}")`);
      }
    }
    lines.push("");
    lines.push("        yield {");
    for (const sel of config.selectors) {
      const varName = sel.name || "data";
      lines.push(`            "${varName}": ${varName}.text if ${varName} else None,`);
    }
    lines.push("        }");
  } else {
    lines.push("        yield {");
    lines.push('            "title": page.css("title").text,');
    lines.push('            "url": page.url,');
    lines.push("        }");
  }
  
  lines.push("");
  lines.push("");
  lines.push("# 运行爬虫");

  const runArgs: string[] = [];
  if (config.sessionType !== "FetcherSession") {
    runArgs.push(`session=${config.sessionType}()`);
  }
  if (config.devMode) {
    runArgs.push("dev_mode=True");
  }

  if (runArgs.length > 0) {
    lines.push(`${config.name}().run(${runArgs.join(", ")})`);
  } else {
    lines.push(`${config.name}().run()`);
  }

  return lines.join("\n");
}

// ===== Proxy Code Generation =====

export interface ProxyConfig {
  proxies: string[];
  strategy: "round_robin" | "random";
}

export function generateProxyCode(config: ProxyConfig): string {
  const lines: string[] = [];
  
  lines.push("from scrapling import Fetcher");
  lines.push("");
  
  lines.push("# 代理列表");
  lines.push("proxies = [");
  for (const p of config.proxies) {
    lines.push(`    "${p}",`);
  }
  lines.push("]");
  lines.push("");
  
  lines.push("# 使用代理抓取");
  lines.push('fetcher = Fetcher()');
  lines.push("");
  lines.push("for proxy in proxies:");
  lines.push('    page = fetcher.fetch("https://example.com", proxy={"https": proxy})');
  lines.push("    print(page.status)");

  return lines.join("\n");
}

// ===== Session Code Generation =====

export interface SessionConfig {
  type: "FetcherSession" | "StealthySession" | "DynamicSession" | "AsyncFetcherSession" | "AsyncStealthySession" | "AsyncDynamicSession";
  impersonate: string;
  headless: boolean;
  maxPages: number;
  autoReferer: boolean;
}

export function generateSessionCode(config: SessionConfig): string {
  const lines: string[] = [];
  const isAsync = config.type.startsWith("Async");
  
  lines.push(`from scrapling.sessions import ${config.type}`);
  lines.push("");

  const args: string[] = [];
  if (config.impersonate) {
    args.push(`impersonate="${config.impersonate}"`);
  }
  if (!config.headless && !config.type.includes("Fetcher")) {
    args.push("headless=False");
  }
  if (config.maxPages !== 0) {
    args.push(`max_pages=${config.maxPages}`);
  }
  if (config.autoReferer) {
    args.push("auto_referer=True");
  }

  const initStr = args.length > 0
    ? `session = ${config.type}(${args.join(", ")})`
    : `session = ${config.type}()`;
  lines.push(initStr);
  lines.push("");

  if (isAsync) {
    lines.push("import asyncio");
    lines.push("");
    lines.push("async def main():");
    lines.push('    page = await session.fetch("https://example.com")');
    lines.push("    print(page.status)");
    lines.push("");
    lines.push('    # 使用同一会话访问多个页面');
    lines.push('    page2 = await session.fetch("https://example.com/page2")');
    lines.push("    print(page2.status)");
    lines.push("");
    lines.push("asyncio.run(main())");
  } else {
    lines.push('page = session.fetch("https://example.com")');
    lines.push("print(page.status)");
    lines.push("");
    lines.push("# 使用同一会话访问多个页面");
    lines.push('page2 = session.fetch("https://example.com/page2")');
    lines.push("print(page2.status)");
  }

  return lines.join("\n");
}
