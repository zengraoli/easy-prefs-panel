import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { Globe, Loader2, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WebPreview } from "@/components/WebPreview";
import { FieldPanel, type SelectedField } from "@/components/FieldPanel";
import { FieldNamePopover } from "@/components/FieldNamePopover";
import { CodePreview } from "@/components/CodePreview";
import { InfoTooltip } from "@/components/InfoTooltip";
import { previewApi } from "@/lib/api";
import { generateFetcherCode, type FetcherConfig } from "@/lib/codegen";

export const Route = createFileRoute("/selector")({
  component: SelectorPage,
  head: () => ({
    meta: [
      { title: "可视化选择器 — Scrapling 配置器" },
      { name: "description", content: "鼠标点选网页元素，自动生成 CSS 选择器和抓取代码" },
    ],
  }),
});

function SelectorPage() {
  const [url, setUrl] = useState("https://example.com");
  const [fetcherType, setFetcherType] = useState("normal");
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<SelectedField[]>([]);
  const [pendingElement, setPendingElement] = useState<{ selector: string; text: string; tag: string } | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [similarLoading, setSimilarLoading] = useState(false);

  const handleLoadPage = async () => {
    setLoading(true);
    setHtml(null);
    try {
      const res = await previewApi.fetch(url, fetcherType);
      if (res.success && res.html) {
        setHtml(res.html);
      } else {
        alert("加载失败: " + (res.error || "未知错误"));
      }
    } catch (e) {
      alert("连接后端失败，请确认后端服务已启动");
    } finally {
      setLoading(false);
    }
  };

  const handleElementClick = useCallback((selector: string, text: string, tag: string) => {
    setPendingElement({ selector, text, tag });
  }, []);

  const handleNameConfirm = (name: string) => {
    if (!pendingElement) return;
    const newField: SelectedField = {
      id: crypto.randomUUID(),
      name,
      selector: pendingElement.selector,
      previewText: pendingElement.text,
      tag: pendingElement.tag,
    };
    setFields((prev) => [...prev, newField]);
    setPendingElement(null);
  };

  const handleRemoveField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleFindSimilar = async () => {
    if (fields.length === 0) return;
    const lastField = fields[fields.length - 1];
    setSimilarLoading(true);
    try {
      const res = await previewApi.similar(url, lastField.selector, fetcherType);
      if (res.success && res.results && res.results.length > 0) {
        alert(`找到 ${res.results.length} 个相似元素！\n\n` + res.results.map((r, i) => `${i + 1}. [${r.tag}] ${r.text.substring(0, 80)}`).join("\n"));
      } else {
        alert("未找到相似元素");
      }
    } catch {
      alert("检测失败，请确认后端服务已启动");
    } finally {
      setSimilarLoading(false);
    }
  };

  const handleGenerateCode = () => {
    setShowCode(true);
  };

  // Build code from selected fields
  const generatedCode = generateFetcherCode({
    type: fetcherType === "stealthy" ? "StealthyFetcher" : fetcherType === "playwright" ? "PlayWrightFetcher" : "Fetcher",
    url,
    headless: true,
    disableResources: false,
    useProxy: false,
    proxyAddress: "",
    timeout: 10,
    blockImages: false,
    humanize: false,
    disableWebgl: false,
    hideCanvas: false,
    networkIdle: false,
    selectors: fields.map((f) => ({
      name: f.name,
      type: "css" as const,
      value: f.selector,
    })),
  });

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6">
      {/* Top bar: URL input */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[300px]">
          <Label className="mb-1.5 flex items-center gap-1.5">
            目标网址
            <InfoTooltip text="输入你想抓取数据的网页地址" />
          </Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>
        <div className="w-48">
          <Label className="mb-1.5 flex items-center gap-1.5">
            抓取方式
            <InfoTooltip text="普通最快，隐身绕反爬，浏览器处理 JS 渲染页面" />
          </Label>
          <Select value={fetcherType} onValueChange={setFetcherType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">普通抓取</SelectItem>
              <SelectItem value="stealthy">隐身抓取</SelectItem>
              <SelectItem value="playwright">浏览器抓取</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleLoadPage} disabled={loading || !url} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
          加载页面
        </Button>
      </div>

      {/* Main area: left preview + right panel */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Left: Web preview */}
        <div className="relative">
          <FieldNamePopover
            open={!!pendingElement}
            onClose={() => setPendingElement(null)}
            onConfirm={handleNameConfirm}
          >
            <div className="h-full">
              <WebPreview html={html} loading={loading} onElementClick={handleElementClick} />
            </div>
          </FieldNamePopover>

          {/* Bottom action bar */}
          {html && (
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFindSimilar}
                disabled={fields.length === 0 || similarLoading}
                className="gap-1.5"
              >
                {similarLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                检测相似元素
              </Button>
            </div>
          )}
        </div>

        {/* Right: Field panel */}
        <div className="rounded-lg border bg-card p-4">
          <FieldPanel fields={fields} onRemove={handleRemoveField} onGenerateCode={handleGenerateCode} />
        </div>
      </div>

      {/* Code preview modal */}
      {showCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCode(false)}>
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-card p-1" onClick={(e) => e.stopPropagation()}>
            <CodePreview code={generatedCode} title="生成的抓取代码" filename="scrape.py" />
            <div className="p-3 text-right">
              <Button variant="outline" size="sm" onClick={() => setShowCode(false)}>关闭</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
