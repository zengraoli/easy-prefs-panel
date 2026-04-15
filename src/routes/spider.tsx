import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
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
import { generateSpiderCode, type SpiderConfig, type SelectorRule, type PaginationConfig, type DistributedConfig, type DistributedWorker } from "@/lib/codegen";
import { workersApi, type WorkerData } from "@/lib/api";

export const Route = createFileRoute("/spider")({
  component: SpiderPage,
  head: () => ({
    meta: [
      { title: "爬虫配置 — Scrapling 配置器" },
      { name: "description", content: "配置 Scrapling Spider 自动化爬虫" },
    ],
  }),
});

const STEPS = ["基本信息", "并发与翻页", "数据选择", "高级选项"];

function SpiderPage() {
  const [step, setStep] = useState(0);
  const [availableWorkers, setAvailableWorkers] = useState<WorkerData[]>([]);
  const [config, setConfig] = useState<SpiderConfig>({
    name: "MySpider",
    startUrls: ["https://example.com"],
    concurrency: 1,
    delay: 0,
    maxDepth: 0,
    sessionType: "FetcherSession",
    selectors: [],
    exportFormat: "json",
    crawlDir: "",
    respectRobots: false,
    devMode: false,
    pagination: {
      mode: "none",
      urlTemplate: "",
      startPage: 1,
      endPage: 10,
      maxPages: 0,
    },
    distributed: {
      enabled: false,
      workers: [],
      strategy: "replicate",
    },
  });

  useEffect(() => {
    workersApi.list().then(setAvailableWorkers).catch(() => {});
  }, []);

  const update = (partial: Partial<SpiderConfig>) => setConfig((c) => ({ ...c, ...partial }));
  const updatePagination = (partial: Partial<PaginationConfig>) =>
    setConfig((c) => ({ ...c, pagination: { ...c.pagination, ...partial } }));
  const updateDistributed = (partial: Partial<DistributedConfig>) =>
    setConfig((c) => ({ ...c, distributed: { ...(c.distributed || { enabled: false, workers: [], strategy: "replicate" }), ...partial } }));

  const addUrl = () => update({ startUrls: [...config.startUrls, ""] });
  const removeUrl = (i: number) => update({ startUrls: config.startUrls.filter((_, j) => j !== i) });
  const updateUrl = (i: number, v: string) => {
    const next = [...config.startUrls];
    next[i] = v;
    update({ startUrls: next });
  };

  const addSelector = () =>
    update({ selectors: [...config.selectors, { name: "", type: "css", value: "" }] });
  const updateSelector = (i: number, partial: Partial<SelectorRule>) => {
    const next = [...config.selectors];
    next[i] = { ...next[i], ...partial };
    update({ selectors: next });
  };
  const removeSelector = (i: number) =>
    update({ selectors: config.selectors.filter((_, j) => j !== i) });

  const toggleWorker = (w: WorkerData, checked: boolean) => {
    const current = config.distributed?.workers || [];
    if (checked) {
      const dw: DistributedWorker = { name: w.name, ip: w.ip, port: w.ssh_port, username: w.username };
      updateDistributed({ workers: [...current, dw] });
    } else {
      updateDistributed({ workers: current.filter((x) => x.ip !== w.ip) });
    }
  };

  const code = generateSpiderCode(config);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <StepIndicator steps={STEPS} currentStep={step} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold">基本信息</h2>
              <div>
                <Label className="mb-1.5 flex items-center gap-1.5">
                  爬虫名称
                  <InfoTooltip text="给你的爬虫取一个名字，会用作 Python 类名" />
                </Label>
                <Input value={config.name} onChange={(e) => update({ name: e.target.value })} placeholder="MySpider" />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <Label className="flex items-center gap-1.5">
                    起始网址
                    <InfoTooltip text="爬虫从这些网址开始抓取，可以添加多个" />
                  </Label>
                  <Button size="sm" variant="outline" onClick={addUrl} className="h-7 gap-1 text-xs">
                    <Plus className="h-3.5 w-3.5" /> 添加
                  </Button>
                </div>
                <div className="space-y-2">
                  {config.startUrls.map((url, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={url} onChange={(e) => updateUrl(i, e.target.value)} placeholder="https://example.com" className="flex-1" />
                      {config.startUrls.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeUrl(i)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-1.5 flex items-center gap-1.5">
                  会话类型
                  <InfoTooltip text="选择不同的会话类型来处理不同的网站防护" />
                </Label>
                <Select value={config.sessionType} onValueChange={(v) => update({ sessionType: v as SpiderConfig["sessionType"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FetcherSession">普通会话（最快）</SelectItem>
                    <SelectItem value="StealthySession">隐秘会话（反反爬）</SelectItem>
                    <SelectItem value="DynamicSession">动态会话（JS 渲染）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold">并发与翻页</h2>
              <div>
                <Label className="mb-1.5 flex items-center gap-1.5">
                  并发数
                  <InfoTooltip text="同时抓取的页面数量" />
                </Label>
                <Input type="number" min={1} max={50} value={config.concurrency} onChange={(e) => update({ concurrency: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="mb-1.5 flex items-center gap-1.5">
                  下载延迟（秒）
                  <InfoTooltip text="每次请求之间的等待时间" />
                </Label>
                <Input type="number" min={0} max={60} step={0.5} value={config.delay} onChange={(e) => update({ delay: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="mb-1.5 flex items-center gap-1.5">
                  最大深度
                  <InfoTooltip text="从起始页面开始最多跟踪几层链接。0 表示不限制" />
                </Label>
                <Input type="number" min={0} max={100} value={config.maxDepth} onChange={(e) => update({ maxDepth: Number(e.target.value) })} />
              </div>

              {/* Pagination */}
              <div className="rounded-lg border p-4 space-y-3">
                <Label className="flex items-center gap-1.5 font-semibold">
                  翻页模式
                  <InfoTooltip text="配置爬虫如何处理多页内容" />
                </Label>
                <Select value={config.pagination.mode} onValueChange={(v) => updatePagination({ mode: v as PaginationConfig["mode"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不翻页</SelectItem>
                    <SelectItem value="auto">自动检测下一页</SelectItem>
                    <SelectItem value="url_pattern">URL 参数翻页</SelectItem>
                  </SelectContent>
                </Select>

                {config.pagination.mode === "url_pattern" && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <Label className="mb-1 text-xs flex items-center gap-1">
                        URL 模板
                        <InfoTooltip text="用 {page} 替代页码，如 https://example.com/list?page={page}" />
                      </Label>
                      <Input value={config.pagination.urlTemplate} onChange={(e) => updatePagination({ urlTemplate: e.target.value })} placeholder="https://example.com/list?page={page}" className="font-mono text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 text-xs">起始页码</Label>
                        <Input type="number" min={1} value={config.pagination.startPage} onChange={(e) => updatePagination({ startPage: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label className="mb-1 text-xs">结束页码</Label>
                        <Input type="number" min={1} value={config.pagination.endPage} onChange={(e) => updatePagination({ endPage: Number(e.target.value) })} />
                      </div>
                    </div>
                  </div>
                )}

                {config.pagination.mode !== "none" && (
                  <div>
                    <Label className="mb-1 text-xs flex items-center gap-1">
                      最多抓取页数
                      <InfoTooltip text="限制最大抓取页数，0 表示不限制" />
                    </Label>
                    <Input type="number" min={0} value={config.pagination.maxPages} onChange={(e) => updatePagination({ maxPages: Number(e.target.value) })} />
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
                  <p className="text-sm text-muted-foreground">定义要从每个页面中提取的数据</p>
                </div>
                <Button size="sm" onClick={addSelector} className="gap-1.5">
                  <Plus className="h-4 w-4" /> 添加规则
                </Button>
              </div>

              {config.selectors.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    未添加选择器，将使用默认提取（标题和 URL）
                  </CardContent>
                </Card>
              )}

              {config.selectors.map((sel, i) => (
                <Card key={i}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">规则 {i + 1}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeSelector(i)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
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
                            <SelectItem value="xpath">XPath</SelectItem>
                            <SelectItem value="text">文本搜索</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="mb-1 text-xs">表达式</Label>
                      <Input value={sel.value} onChange={(e) => updateSelector(i, { value: e.target.value })} placeholder="h1.title" className="h-8 font-mono text-sm" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold">高级选项</h2>
              <div>
                <Label className="mb-1.5 flex items-center gap-1.5">
                  断点续爬目录
                  <InfoTooltip text="设置保存目录后，爬虫中断可以从上次位置继续" />
                </Label>
                <Input value={config.crawlDir} onChange={(e) => update({ crawlDir: e.target.value })} placeholder="./crawl_data（留空则不启用）" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="flex items-center gap-1.5">
                    遵守 robots.txt
                    <InfoTooltip text="开启后会遵守网站的爬虫协议" />
                  </Label>
                  <p className="text-xs text-muted-foreground">尊重网站的爬虫规则</p>
                </div>
                <Switch checked={config.respectRobots} onCheckedChange={(v) => update({ respectRobots: v })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="flex items-center gap-1.5">
                    开发模式
                    <InfoTooltip text="开启后只抓取少量页面用于测试" />
                  </Label>
                  <p className="text-xs text-muted-foreground">限制抓取量，方便调试</p>
                </div>
                <Switch checked={config.devMode} onCheckedChange={(v) => update({ devMode: v })} />
              </div>

              {/* Distributed execution */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="flex items-center gap-1.5 font-semibold">
                      分布式执行
                      <InfoTooltip text="将爬虫脚本分发到多台远程机器上并行执行" />
                    </Label>
                    <p className="text-xs text-muted-foreground">在多台机器上同时运行爬虫</p>
                  </div>
                  <Switch checked={config.distributed?.enabled || false} onCheckedChange={(v) => updateDistributed({ enabled: v })} />
                </div>

                {config.distributed?.enabled && (
                  <>
                    {availableWorkers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        尚未添加远程机器。请先到「机器管理」页面添加。
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-xs">选择执行机器</Label>
                        {availableWorkers.map((w) => (
                          <div key={w.id} className="flex items-center gap-2">
                            <Checkbox
                              checked={config.distributed?.workers.some((x) => x.ip === w.ip) || false}
                              onCheckedChange={(v) => toggleWorker(w, !!v)}
                            />
                            <span className="text-sm">{w.name} ({w.ip})</span>
                            {w.online ? (
                              <span className="text-xs text-success">🟢</span>
                            ) : (
                              <span className="text-xs text-destructive">🔴</span>
                            )}
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
            <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> 上一步
            </Button>
            <Button onClick={() => setStep(Math.min(3, step + 1))} disabled={step === 3}>
              下一步 <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <CodePreview code={code} title="生成的 Spider 代码" filename="spider.py" />
        </div>
      </div>
    </main>
  );
}
