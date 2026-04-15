import { X, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface SelectedField {
  id: string;
  name: string;
  selector: string;
  previewText: string;
  tag: string;
}

interface FieldPanelProps {
  fields: SelectedField[];
  onRemove: (id: string) => void;
  onGenerateCode: () => void;
}

export function FieldPanel({ fields, onRemove, onGenerateCode }: FieldPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">已选字段 ({fields.length})</h3>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {fields.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Tag className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">点击左侧网页中的元素来选择数据字段</p>
          </div>
        )}

        {fields.map((field) => (
          <Card key={field.id} className="border-success/30 bg-success/5">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{field.name}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                      {field.tag}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-mono text-xs text-muted-foreground" title={field.selector}>
                    {field.selector}
                  </p>
                  <p className="mt-1 truncate text-xs text-foreground/70" title={field.previewText}>
                    {field.previewText || "(空)"}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onRemove(field.id)}>
                  <X className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {fields.length > 0 && (
        <Button className="mt-4 w-full" onClick={onGenerateCode}>
          生成抓取脚本
        </Button>
      )}
    </div>
  );
}
