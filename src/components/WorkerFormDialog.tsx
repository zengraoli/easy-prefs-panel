import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WorkerFormData } from "@/lib/api";

interface WorkerFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: WorkerFormData) => void;
  initialData?: WorkerFormData;
  title?: string;
}

const defaultData: WorkerFormData = {
  name: "",
  ip: "",
  ssh_port: 22,
  username: "root",
  auth_method: "password",
  password: "",
  key_path: "",
  max_concurrency: 2,
};

export function WorkerFormDialog({ open, onClose, onSubmit, initialData, title = "添加机器" }: WorkerFormDialogProps) {
  const [form, setForm] = useState<WorkerFormData>(initialData || defaultData);

  useEffect(() => {
    if (open) {
      setForm(initialData || defaultData);
    }
  }, [open, initialData]);

  const update = (partial: Partial<WorkerFormData>) => setForm((f) => ({ ...f, ...partial }));

  const handleSubmit = () => {
    if (!form.name || !form.ip || !form.username) return;
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5">机器名称</Label>
            <Input value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="生产服务器 1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5">IP 地址</Label>
              <Input value={form.ip} onChange={(e) => update({ ip: e.target.value })} placeholder="192.168.1.100" />
            </div>
            <div>
              <Label className="mb-1.5">SSH 端口</Label>
              <Input type="number" value={form.ssh_port} onChange={(e) => update({ ssh_port: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <Label className="mb-1.5">用户名</Label>
            <Input value={form.username} onChange={(e) => update({ username: e.target.value })} placeholder="root" />
          </div>
          <div>
            <Label className="mb-1.5">认证方式</Label>
            <Select value={form.auth_method} onValueChange={(v) => update({ auth_method: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="password">密码</SelectItem>
                <SelectItem value="key">密钥</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.auth_method === "password" ? (
            <div>
              <Label className="mb-1.5">密码</Label>
              <Input type="password" value={form.password || ""} onChange={(e) => update({ password: e.target.value })} />
            </div>
          ) : (
            <div>
              <Label className="mb-1.5">密钥路径</Label>
              <Input value={form.key_path || ""} onChange={(e) => update({ key_path: e.target.value })} placeholder="~/.ssh/id_rsa" />
            </div>
          )}
          <div>
            <Label className="mb-1.5">最大并发任务数</Label>
            <Input type="number" min={1} max={20} value={form.max_concurrency} onChange={(e) => update({ max_concurrency: Number(e.target.value) })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit} disabled={!form.name || !form.ip}>确定</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
