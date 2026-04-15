import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe, Bot, Shield, Wifi, MousePointerClick, Server } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Scrapling 可视化配置生成器 — 首页" },
      { name: "description", content: "无需编程经验，通过可视化表单生成 Scrapling 网页抓取的 Python 代码" },
    ],
  }),
});

const features = [
  {
    to: "/selector" as const,
    icon: MousePointerClick,
    title: "可视化选择器",
    desc: "打开网页，鼠标点选你想要的数据，自动生成选择器和抓取代码",
    color: "bg-chart-5/10 text-chart-5",
  },
  {
    to: "/fetcher" as const,
    icon: Globe,
    title: "单页抓取",
    desc: "快速抓取单个网页内容，支持普通抓取、反反爬和动态页面三种模式",
    color: "bg-primary/10 text-primary",
  },
  {
    to: "/spider" as const,
    icon: Bot,
    title: "爬虫配置",
    desc: "配置自动化爬虫，批量抓取多个页面，支持并发、深度控制和断点续爬",
    color: "bg-chart-2/10 text-chart-2",
  },
  {
    to: "/proxy" as const,
    icon: Shield,
    title: "代理管理",
    desc: "管理代理 IP 列表，配置轮换策略，避免被目标网站封禁",
    color: "bg-chart-3/10 text-chart-3",
  },
  {
    to: "/session" as const,
    icon: Wifi,
    title: "会话管理",
    desc: "保持登录状态访问多个页面，模拟真实用户的连续浏览行为",
    color: "bg-chart-4/10 text-chart-4",
  },
  {
    to: "/workers" as const,
    icon: Server,
    title: "机器管理",
    desc: "管理远程执行服务器，查看状态、测试连接、部署爬虫脚本",
    color: "bg-chart-1/10 text-chart-1",
  },
];

function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      {/* Hero */}
      <div className="mb-16 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-secondary px-4 py-1.5 text-xs font-medium text-secondary-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          开源免费 · 无需登录
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Scrapling 可视化配置
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          无需编程经验，通过简单的表单填写，自动生成可直接运行的 Python 网页抓取代码
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <Link key={f.to} to={f.to} className="group">
            <Card className="h-full border transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
              <CardContent className="p-6">
                <div className={`mb-4 inline-flex rounded-xl p-3 ${f.color}`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h2 className="mb-2 text-lg font-semibold text-foreground group-hover:text-primary">
                  {f.title}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick intro */}
      <div className="mt-16 rounded-2xl border bg-card p-8 text-center">
        <h2 className="mb-3 text-lg font-semibold">什么是 Scrapling？</h2>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Scrapling 是一个高性能的 Python 网页抓取库，支持智能识别网页元素（即使网站改版也能找到目标数据）、
          内置反反爬机制（绕过 Cloudflare 等防护）、自动化爬虫框架，是目前最强大的 Python 抓取工具之一。
          本工具帮助你通过可视化界面生成 Scrapling 的 Python 配置代码，无需手动编写。
        </p>
      </div>
    </main>
  );
}
