const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function apiFetch<T = unknown>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Preview APIs
export const previewApi = {
  fetch: (url: string, fetcherType: string) =>
    apiFetch<{ success: boolean; html?: string; error?: string }>("/api/preview/fetch", { url, fetcher_type: fetcherType }),
  test: (url: string, selector: string, selectorType: string, attribute?: string) =>
    apiFetch<{ success: boolean; results?: Array<{ text: string; tag: string }>; error?: string }>("/api/preview/test", { url, selector, selector_type: selectorType, attribute }),
  similar: (url: string, selector: string) =>
    apiFetch<{ success: boolean; results?: Array<{ text: string; tag: string; html: string }>; error?: string }>("/api/preview/similar", { url, selector }),
};

// Worker APIs
export interface WorkerData {
  id: number;
  name: string;
  ip: string;
  ssh_port: number;
  username: string;
  auth_method: string;
  max_concurrency: number;
  online: boolean;
  cpu_percent: number;
  mem_percent: number;
}

export interface WorkerFormData {
  name: string;
  ip: string;
  ssh_port: number;
  username: string;
  auth_method: string;
  password?: string;
  key_path?: string;
  max_concurrency: number;
}

export const workersApi = {
  list: () => apiFetch<WorkerData[]>("/api/workers"),
  create: (data: WorkerFormData) => apiFetch<{ id: number; name: string }>("/api/workers", data),
  update: (id: number, data: WorkerFormData) =>
    apiFetch<{ success: boolean }>(`/api/workers/${id}`, data),
  remove: (id: number) =>
    fetch(`${API_BASE}/api/workers/${id}`, { method: "DELETE" }).then((r) => r.json()),
  test: (id: number) => apiFetch<{ success: boolean; message: string }>(`/api/workers/${id}/test`, {}),
  deploy: (id: number, script: string) =>
    apiFetch<{ success: boolean; output?: string; errors?: string; message?: string }>(`/api/workers/${id}/deploy`, { script }),
};
