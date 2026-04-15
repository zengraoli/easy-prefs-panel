import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Zap, ShieldCheck, Clapperboard, Plus, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StepIndicator } from "@/components/StepIndicator";
import { CodePreview } from "@/components/CodePreview";
import { InfoTooltip } from "@/components/InfoTooltip";
import { generateFetcherCode, type FetcherConfig, type SelectorRule, type DistributedConfig, type DistributedWorker } from "@/lib/codegen";
import { workersApi, type WorkerData } from "@/lib/api";

export const Route = createFileRoute("/fetcher")({
  component: FetcherPage,
  head: () => ({
    meta: [
      { title: "单页抓取配置 — Scrapling 配置器" },
      { name: "description", content: "配置 Scrapling 的 Fetcher、StealthyFetcher 或 PlayWrightFetcher" },
    ],
  }),
});

const STEPS = ["选择模式", "基本设置", "数据选择", "高级选项"];

const fetcherTypes = [
  { type: "Fetcher" as const, icon: Zap, title: "快速抓取", desc: "适合简单网页，速度最快，资源消耗最小", tag: "推荐入门" },
  { type: "StealthyFetcher" as const, icon: ShieldCheck, title: "隐秘抓取", desc: "绕过 Cloudflare 等反爬机制，模拟真实浏览器指纹", tag: "反反爬" },
  { type: "PlayWrightFetcher" as const, icon: Clapperboard, title: "动态页面", desc: "处理需要 JavaScript 渲染的页面，支持页面交互", tag: "JS 渲染" },
];

function FetcherPage() {
  const [step, setStep] = useState(0);
  const [availableWorkers, setAvailableWorkers] = useState<WorkerData[]>([]);
  const [config, setConfig] = useState<FetcherConfig>({
    type: "Fetcher",
    url: "https://example.com",
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
    selectors: [],
    distributed: { enabled: false, workers: [], strategy: "replicate" },
  });

  useEffect(() => {
    workersApi.list().then(setAvailableWorkers).catch(() => {});
  }, []);

  const update = (partial: Partial<FetcherConfig>) => setConfig((c) => ({ ...c, ...partial }));
  const updateDistributed = (partial: Partial<DistributedConfig>) =>
    setConfig((c) => ({ ...c, distributed: { ...(c.distributed || { enabled: false, workers: [], strategy: "replicate" }), ...partial } }));

  const addSelector = () => {
    update({ selectors: [...config.selectors, { name: "", type: "css", value: "", attribute: "" }] });
  };
  const updateSelector = (i: number, partial: Partial<SelectorRule>) => {
    const next = [...config.selectors];
    next[i] = { ...next[i], ...partial };
    update({ selectors: next });
  };
  const removeSelector = (i: number) => {
    update({ selectors: config.selectors.filter((_, j) => j !== i) });
  };

  const toggleWorker = (w: WorkerData, checked: boolean) => {
    const current = config.distributed?.workers || [];
    if (checked) {
      const dw: DistributedWorker = { name: w.name, ip: w.ip, port: w.ssh_port, username: w.username };
      updateDistributed({ workers: [...current, dw] });
    } else {
      updateDistributed({ workers: current.filter((x) => x.ip !== w.ip) });
    }
  };

  const code = generateFetcherCode(config);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <StepIndicator steps={STEPS} currentStep={step} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {step === 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">选择抓取模式</h2>
              <p className="text-sm text-muted-foreground">根据目标网站的类型选择合适的抓取方式</p>
              <div className="space-y-3">
                {fetcherTypes.map((ft) => (
                  <Card key={ft.type} className={`cursor-pointer transition-all ${config.type === ft.type ? "border-primary bg-primary/5 shadow-md" : "hover:border-muted-foreground/30"}`} onClick={() => update({ type: ft.type })}>
                    <CardContent className="flex items-start gap-4 p-5">
                      <div className="rounded-lg bg-primary/10 p-2.5 text-primary"><ft.icon className="h-5 w-5" /></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{ft.title}</h3>
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{ft.tag}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{ft.desc}</p>
                      </div>
                      <div className={`mt-1 h-4 w-4 rounded-full border-2 ${config.type === ft.type ? "border-primary bg-primary" : "border-muted-foreground/30"}`} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold">基本设置</h2>
              <div className="space-y-4">
                <div>
                  <Label className="mb-1.5 flex items-center gap-1.5">目标网址 <InfoTooltip text="输入你想抓取的网页完整地址" /></Label>
                  <Input value={config.url} onChange={(e) => update({ url: e.target.value })} placeholder="https://example.com" />
                </div>
                <div>
                  <Label className="mb-1.5 flex items-center gap-1.5">超时时间（秒）<InfoTooltip text="等待网页响应的最长时间" /></Label>
                  <Input type="number" min={1} max={120} value={config.timeout} onChange={(e) => update({ timeout: Number(e.target.value) })} />
                </div>
                {config.type !== "Fetcher" && (
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label className="flex items-center gap-1.5">无头模式 <InfoTooltip text="开启后浏览器在后台运行" /></Label>
                      <p className="text-xs text-muted-foreground">浏览器在后台静默运行</p>
                    </div>
                    <Switch checked={config.headless} onCheckedChange={(v) => update({ headless: v })} />
                  </div>
                )}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label className="flex items-center gap-1.5">使用代理 <InfoTooltip text="通过代理 IP 访问目标网站" /></Label>
                    <p className="text-xs text-muted-foreground">通过代理服务器访问</p>
                  </div>
                  <Switch checked={config.useProxy} onCheckedChange={(v) => update({ useProxy: v })} />
                </div>
                {config.useProxy && (
                  <div>
                    <Label className="mb-1.5">代理地址</Label>
                    <Input value={config.proxyAddress} onChange={(e) => update({ proxyAddress: e.target.value })} placeholder="http://user:pass@proxy:port" />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">数据选择器</h2>
                  <p className="text-sm text-muted-foreground">定义要从页面中提取的数据</p>
                </div>
                <Button size="sm" onClick={addSelector} className="gap-1.5"><Plus className="h-4 w-4" /> 添加规则</Button>
              </div>
              {config.selectors.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">还没有选择器规则。点击"添加规则"开始定义要提取的数据。</CardContent>
                </Card>
              )}
              {config.selectors.map((sel, i) => (
                <Card key={i}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">规则 {i + 1}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeSelector(i)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 text-xs">变量名</Label>
                        <Input value={sel.name} onChange={(e) => updateSelector(i, { name: e.target.value })} placeholder="title" className="h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="mb-1 text-xs">选择方式</Label>
                        <Select value={sel.type} onValueChange={(v) => updateSelector(i, { type: v as SelectorRule["type"] })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="css">CSS 选择器</SelectItem>
                            <SelectItem value="xpath">XPath 路径</SelectItem>
                            <SelectItem value="text">文本搜索</SelectItem>
                            <SelectItem value="similar">相似元素</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="mb-1 text-xs">选择器表达式</Label>
                      <Input value={sel.value} onChange={(e) => updateSelector(i, { value: e.target.value })} placeholder={sel.type === "css" ? "h1.title" : sel.type === "xpath" ? "//h1" : "搜索文本"} className="h-8 font-mono text-sm" />
                    </div>
                    {sel.type === "css" && (
                      <div>
                        <Label className="mb-1 text-xs">提取属性（可选）</Label>
                        <Input value={sel.attribute || ""} onChange={(e) => updateSelector(i, { attribute: e.target.value })} placeholder="href / src / class（留空提取文本）" className="h-8 text-sm" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold">高级选项</h2>
              {config.type !== "Fetcher" && (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div><Label>禁用额外资源</Label><p className="text-xs text-muted-foreground">不加载 CSS、字体等</p></div>
                  <Switch checked={config.disableResources} onCheckedChange={(v) => update({ disableResources: v })} />
                </div>
              )}
              {config.type === "StealthyFetcher" && (
                <>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div><Label>屏蔽图片</Label><p className="text-xs text-muted-foreground">节省带宽和流量</p></div>
                    <Switch checked={config.blockImages} onCheckedChange={(v) => update({ blockImages: v })} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div><Label>模拟人类行为</Label><p className="text-xs text-muted-foreground">模拟鼠标和滚动行为</p></div>
                    <Switch checked={config.humanize} onCheckedChange={(v) => update({ humanize: v })} />
                  </div>
                </>
              )}
              {config.type === "PlayWrightFetcher" && (
                <>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div><Label>禁用 WebGL</Label><p className="text-xs text-muted-foreground">减少指纹暴露</p></div>
                    <Switch checked={config.disableWebgl} onCheckedChange={(v) => update({ disableWebgl: v })} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div><Label>隐藏 Canvas</Label><p className="text-xs text-muted-foreground">防止指纹识别</p></div>
                    <Switch checked={config.hideCanvas} onCheckedChange={(v) => update({ hideCanvas: v })} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div><Label>等待网络空闲</Label><p className="text-xs text-muted-foreground">等待所有请求完成再提取</p></div>
                    <Switch checked={config.networkIdle} onCheckedChange={(v) => update({ networkIdle: v })} />
                  </div>
                </>
              )}
              {config.type === "Fetcher" && (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">快速抓取模式暂无额外高级选项。如需更多控制，请切换到其他模式。</CardContent>
                </Card>
              )}

              {/* Distributed */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="flex items-center gap-1.5 font-semibold">分布式执行 <InfoTooltip text="将脚本分发到多台远程机器上执行" /></Label>
                    <p className="text-xs text-muted-foreground">在多台机器上同时运行</p>
                  </div>
                  <Switch checked={config.distributed?.enabled || false} onCheckedChange={(v) => updateDistributed({ enabled: v })} />
                </div>
                {config.distributed?.enabled && (
                  <>
                    {availableWorkers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">尚未添加远程机器。请先到「机器管理」页面添加。</p>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-xs">选择执行机器</Label>
                        {availableWorkers.map((w) => (
                          <div key={w.id} className="flex items-center gap-2">
                            <Checkbox checked={config.distributed?.workers.some((x) => x.ip === w.ip) || false} onCheckedChange={(v) => toggleWorker(w, !!v)} />
                            <span className="text-sm">{w.name} ({w.ip})</span>
                            {w.online ? <span className="text-xs text-success">🟢</span> : <span className="text-xs text-destructive">🔴</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    <div>
                      <Label className="mb-1 text-xs">任务分发策略</Label>
                      <Select value={config.distributed?.strategy || "replicate"} onValueChange={(v) => updateDistributed({ strategy: v as DistributedConfig["strategy"] })}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="split">平均分配 URL</SelectItem>
                          <SelectItem value="replicate">每台机器完整跑一遍</SelectItem>
                          <SelectItem value="auto">按负载自动分配</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}><ArrowLeft className="mr-1.5 h-4 w-4" /> 上一步</Button>
            <Button onClick={() => setStep(Math.min(3, step + 1))} disabled={step === 3}>下一步 <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
          </div>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <CodePreview code={code} title="生成的 Python 代码" filename="scrape.py" />
        </div>
      </div>
    </main>
  );
}
