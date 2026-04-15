import { Cpu, HardDrive, Wifi, WifiOff, TestTube, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { WorkerData } from "@/lib/api";

interface WorkerCardProps {
  worker: WorkerData;
  onTest: () => void;
  onEdit: () => void;
  onDelete: () => void;
  testing?: boolean;
}

export function WorkerCard({ worker, onTest, onEdit, onDelete, testing }: WorkerCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{worker.name}</h3>
            {worker.online ? (
              <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">
                <Wifi className="h-3 w-3" /> 在线
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                <WifiOff className="h-3 w-3" /> 离线
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onTest} disabled={testing}>
              <TestTube className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        <p className="mt-1 text-sm text-muted-foreground font-mono">
          {worker.username}@{worker.ip}:{worker.ssh_port}
        </p>
        <p className="text-xs text-muted-foreground">最大并发: {worker.max_concurrency}</p>

        {worker.online && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="w-10">CPU</span>
              <Progress value={worker.cpu_percent} className="flex-1 h-2" />
              <span className="w-10 text-right">{worker.cpu_percent.toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="w-10">内存</span>
              <Progress value={worker.mem_percent} className="flex-1 h-2" />
              <span className="w-10 text-right">{worker.mem_percent.toFixed(0)}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
