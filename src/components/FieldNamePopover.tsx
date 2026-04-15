import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const QUICK_NAMES = [
  { label: "标题", value: "title" },
  { label: "价格", value: "price" },
  { label: "链接", value: "link" },
  { label: "图片", value: "image" },
  { label: "日期", value: "date" },
  { label: "摘要", value: "summary" },
];

interface FieldNamePopoverProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  children: React.ReactNode;
}

export function FieldNamePopover({ open, onClose, onConfirm, children }: FieldNamePopoverProps) {
  const [name, setName] = useState("");

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(name.trim());
      setName("");
    }
  };

  const handleQuick = (v: string) => {
    onConfirm(v);
    setName("");
  };

  return (
    <Popover open={open} onOpenChange={(v) => !v && onClose()}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72" side="top" align="center">
        <div className="space-y-3">
          <p className="text-sm font-medium">给这个字段起个名字</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_NAMES.map((q) => (
              <Button key={q.value} size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleQuick(q.value)}>
                {q.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="自定义名称"
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            />
            <Button size="sm" className="h-8" onClick={handleConfirm} disabled={!name.trim()}>
              确定
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
