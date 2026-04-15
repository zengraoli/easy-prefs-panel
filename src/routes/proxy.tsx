import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CodePreview } from "@/components/CodePreview";
import { InfoTooltip } from "@/components/InfoTooltip";
import { generateProxyCode, type ProxyConfig } from "@/lib/codegen";

export const Route = createFileRoute("/proxy")({
  component: ProxyPage,
  head: () => ({
    meta: [
      { title: "代理管理 — Scrapling 配置器" },
      { name: "description", content: "配置代理 IP 列表和轮换策略" },
    ],
  }),
});

function ProxyPage() {
  const [config, setConfig] = useState<ProxyConfig>({
    proxies: [""],
    strategy: "round_robin",
  });

  const addProxy = () => setConfig((c) => ({ ...c, proxies: [...c.proxies, ""] }));
  const removeProxy = (i: number) =>
    setConfig((c) => ({ ...c, proxies: c.proxies.filter((_, j) => j !== i) }));
  const updateProxy = (i: number, v: string) => {
    setConfig((c) => {
      const next = [...c.proxies];
      next[i] = v;
      return { ...c, proxies: next };
    });
  };

  const code = generateProxyCode(config);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">代理管理</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              添加代理 IP 地址，配置轮换策略，避免被目标网站封禁
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                代理列表
                <InfoTooltip text="输入代理服务器地址，格式为 http://用户名:密码@地址:端口" />
              </Label>
              <Button size="sm" variant="outline" onClick={addProxy} className="h-7 gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" /> 添加代理
              </Button>
            </div>
            <div className="space-y-2">
              {config.proxies.map((proxy, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={proxy}
                    onChange={(e) => updateProxy(i, e.target.value)}
                    placeholder="http://user:pass@proxy-host:port"
                    className="flex-1 font-mono text-sm"
                  />
                  {config.proxies.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeProxy(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Card>
            <CardContent className="p-5">
              <h3 className="mb-3 text-sm font-semibold">使用说明</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  代理地址格式：<code className="rounded bg-muted px-1 font-mono text-xs">http://用户名:密码@地址:端口</code>
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  支持 HTTP 和 SOCKS5 代理
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  生成的代码会按顺序轮换使用代理
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <CodePreview code={code} title="生成的代理配置代码" filename="proxy_config.py" />
        </div>
      </div>
    </main>
  );
}
