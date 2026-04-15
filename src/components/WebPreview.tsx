import React, { useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";

interface WebPreviewProps {
  html: string | null;
  loading: boolean;
  onElementClick: (path: string, text: string, tag: string) => void;
}

// Script injected into iframe for element interaction
const INJECT_SCRIPT = `
<script>
(function() {
  let hoveredEl = null;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;pointer-events:none;z-index:99999;border:2px solid #3b82f6;background:rgba(59,130,246,0.1);transition:all 0.15s ease;display:none;';
  document.body.appendChild(overlay);

  function getSelector(el) {
    if (el.id) return '#' + el.id;
    const parts = [];
    while (el && el !== document.body) {
      let sel = el.tagName.toLowerCase();
      if (el.className && typeof el.className === 'string') {
        const cls = el.className.trim().split(/\\s+/).filter(c => !c.startsWith('__')).slice(0, 2).join('.');
        if (cls) sel += '.' + cls;
      }
      const parent = el.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(c => c.tagName === el.tagName);
        if (siblings.length > 1) {
          sel += ':nth-child(' + (Array.from(parent.children).indexOf(el) + 1) + ')';
        }
      }
      parts.unshift(sel);
      el = parent;
    }
    return parts.join(' > ');
  }

  document.addEventListener('mouseover', function(e) {
    hoveredEl = e.target;
    const rect = hoveredEl.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.style.top = rect.top + 'px';
    overlay.style.left = rect.left + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
  });

  document.addEventListener('mouseout', function() {
    overlay.style.display = 'none';
    hoveredEl = null;
  });

  document.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!e.target || e.target === document.body) return;
    const sel = getSelector(e.target);
    window.parent.postMessage({
      type: 'element-selected',
      selector: sel,
      text: (e.target.textContent || '').trim().substring(0, 200),
      tag: e.target.tagName.toLowerCase(),
    }, '*');
  }, true);
})();
</script>
`;

export function WebPreview({ html, loading, onElementClick }: WebPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleMessage = useCallback(
    (e: MessageEvent) => {
      if (e.data?.type === "element-selected") {
        onElementClick(e.data.selector, e.data.text, e.data.tag);
      }
    },
    [onElementClick]
  );

  // Listen for messages
  React.useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-lg border bg-muted/30">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">正在加载网页…</span>
        </div>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-lg border border-dashed bg-muted/10">
        <p className="text-sm text-muted-foreground">输入网址并点击"加载页面"预览网页内容</p>
      </div>
    );
  }

  // Inject interaction script into the HTML
  const injectedHtml = html.replace("</body>", `${INJECT_SCRIPT}</body>`);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={injectedHtml}
      className="h-full min-h-[500px] w-full rounded-lg border bg-white"
      sandbox="allow-scripts allow-same-origin"
      title="网页预览"
    />
  );
}
