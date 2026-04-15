import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkerCard } from "@/components/WorkerCard";
import { WorkerFormDialog } from "@/components/WorkerFormDialog";
import { workersApi, type WorkerData, type WorkerFormData } from "@/lib/api";

export const Route = createFileRoute("/workers")({
  component: WorkersPage,
  head: () => ({
    meta: [
      { title: "机器管理 — Scrapling 配置器" },
      { name: "description", content: "管理远程执行机器，支持 SSH 连接测试和脚本部署" },
    ],
  }),
});

function WorkersPage() {
  const [workers, setWorkers] = useState<WorkerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState<(WorkerFormData & { id: number }) | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const data = await workersApi.list();
      setWorkers(data);
      // Fetch status for each worker in background (non-blocking)
      for (const w of data) {
        workersApi.status(w.id).then((stats) => {
          setWorkers((prev) =>
            prev.map((pw) => (pw.id === stats.id ? { ...pw, online: stats.online, cpu_percent: stats.cpu_percent, mem_percent: stats.mem_percent } : pw))
          );
        }).catch(() => {});
      }
    } catch {
      // Backend not running — show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const handleCreate = async (data: WorkerFormData) => {
    try {
      await workersApi.create(data);
      setShowForm(false);
      loadWorkers();
    } catch {
      alert("添加失败，请检查后端服务");
    }
  };

  const handleUpdate = async (data: WorkerFormData) => {
    if (!editingWorker) return;
    try {
      await workersApi.update(editingWorker.id, data);
      setEditingWorker(null);
      loadWorkers();
    } catch {
      alert("更新失败");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除这台机器？")) return;
    try {
      await workersApi.remove(id);
      loadWorkers();
    } catch {
      alert("删除失败");
    }
  };

  const handleTest = async (id: number) => {
    setTestingId(id);
    try {
      const res = await workersApi.test(id);
      alert(res.success ? `连接成功！\n${res.message}` : `连接失败：${res.message}`);
    } catch {
      alert("测试失败，请检查后端服务");
    } finally {
      setTestingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">远程机器管理</h1>
          <p className="text-sm text-muted-foreground">管理用于分布式爬虫执行的远程服务器</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadWorkers} disabled={loading} className="gap-1.5">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> 刷新
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> 添加机器
          </Button>
        </div>
      </div>

      {workers.length === 0 && !loading && (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">还没有添加远程机器</p>
          <p className="mt-1 text-sm text-muted-foreground">添加机器后可以用于分布式爬虫执行</p>
          <Button className="mt-4" onClick={() => setShowForm(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> 添加第一台机器
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {workers.map((w) => (
          <WorkerCard
            key={w.id}
            worker={w}
            onTest={() => handleTest(w.id)}
            onEdit={() => setEditingWorker({ id: w.id, name: w.name, ip: w.ip, ssh_port: w.ssh_port, username: w.username, auth_method: w.auth_method, max_concurrency: w.max_concurrency })}
            onDelete={() => handleDelete(w.id)}
            testing={testingId === w.id}
          />
        ))}
      </div>

      <WorkerFormDialog open={showForm} onClose={() => setShowForm(false)} onSubmit={handleCreate} title="添加机器" />
      <WorkerFormDialog
        open={!!editingWorker}
        onClose={() => setEditingWorker(null)}
        onSubmit={handleUpdate}
        initialData={editingWorker || undefined}
        title="编辑机器"
      />
    </main>
  );
}
