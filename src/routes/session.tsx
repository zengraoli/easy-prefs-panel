import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CodePreview } from "@/components/CodePreview";
import { InfoTooltip } from "@/components/InfoTooltip";
import { generateSessionCode, type SessionConfig } from "@/lib/codegen";

export const Route = createFileRoute("/session")({
  component: SessionPage,
  head: () => ({
    meta: [
      { title: "会话管理 — Scrapling 配置器" },
      { name: "description", content: "配置 Scrapling 会话管理，保持登录状态访问多个页面" },
    ],
  }),
});

const sessionTypes = [
  { value: "FetcherSession", label: "普通会话", desc: "基础会话，速度快" },
  { value: "StealthySession", label: "隐秘会话", desc: "反反爬，绕过防护" },
  { value: "DynamicSession", label: "动态会话", desc: "支持 JS 渲染" },
  { value: "AsyncFetcherSession", label: "异步普通会话", desc: "异步版本，高并发" },
  { value: "AsyncStealthySession", label: "异步隐秘会话", desc: "异步 + 反反爬" },
  { value: "AsyncDynamicSession", label: "异步动态会话", desc: "异步 + JS 渲染" },
];

const browsers = [
  { value: "", label: "默认" },
  { value: "chrome", label: "Chrome" },
  { value: "firefox", label: "Firefox" },
  { value: "safari", label: "Safari" },
  { value: "edge", label: "Edge" },
];

function SessionPage() {
  const [config, setConfig] = useState<SessionConfig>({
    type: "FetcherSession",
    impersonate: "",
    headless: true,
    maxPages: 0,
    autoReferer: false,
  });

  const update = (partial: Partial<SessionConfig>) => setConfig((c) => ({ ...c, ...partial }));

  const code = generateSessionCode(config);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">会话管理</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              使用会话保持登录状态，连续访问多个页面而不丢失 Cookie 和状态
            </p>
          </div>

          <div>
            <Label className="mb-1.5 flex items-center gap-1.5">
              会话类型
              <InfoTooltip text="选择适合你需求的会话类型。异步版本适合需要同时访问大量页面的场景" />
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {sessionTypes.map((st) => (
                <Card
                  key={st.value}
                  className={`cursor-pointer transition-all ${
                    config.type === st.value
                      ? "border-primary bg-primary/5"
                      : "hover:border-muted-foreground/30"
                  }`}
                  onClick={() => update({ type: st.value as SessionConfig["type"] })}
                >
                  <CardContent className="p-3">
                    <p className="text-sm font-medium">{st.label}</p>
                    <p className="text-xs text-muted-foreground">{st.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-1.5 flex items-center gap-1.5">
              模拟浏览器
              <InfoTooltip text="模拟特定浏览器的请求特征，使访问看起来更真实" />
            </Label>
            <Select value={config.impersonate} onValueChange={(v) => update({ impersonate: v })}>
              <SelectTrigger>
                <SelectValue placeholder="选择浏览器（可选）" />
              </SelectTrigger>
              <SelectContent>
                {browsers.map((b) => (
                  <SelectItem key={b.value} value={b.value || "default"}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!config.type.includes("Fetcher") && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>无头模式</Label>
                <p className="text-xs text-muted-foreground">浏览器在后台运行</p>
              </div>
              <Switch checked={config.headless} onCheckedChange={(v) => update({ headless: v })} />
            </div>
          )}

          <div>
            <Label className="mb-1.5 flex items-center gap-1.5">
              最大页面数
              <InfoTooltip text="单个会话最多访问的页面数量，0 表示不限制" />
            </Label>
            <Input
              type="number"
              min={0}
              value={config.maxPages}
              onChange={(e) => update({ maxPages: Number(e.target.value) })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="flex items-center gap-1.5">
                自动 Referer
                <InfoTooltip text="自动设置 HTTP Referer 头，模拟真实的页面跳转行为" />
              </Label>
              <p className="text-xs text-muted-foreground">模拟真实页面跳转</p>
            </div>
            <Switch checked={config.autoReferer} onCheckedChange={(v) => update({ autoReferer: v })} />
          </div>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <CodePreview code={code} title="生成的会话管理代码" filename="session_config.py" />
        </div>
      </div>
    </main>
  );
}
