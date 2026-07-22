const KEY = "nexus.recentPatients";
const LIMIT = 8;

export interface RecentPatient {
  id: string;
  name: string;
  gender?: string;
  birthDate?: string;
  visitedAt: number;
}

export function addRecentPatient(p: Omit<RecentPatient, "visitedAt">) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    const list: RecentPatient[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((x) => x.id !== p.id);
    filtered.unshift({ ...p, visitedAt: Date.now() });
    window.localStorage.setItem(KEY, JSON.stringify(filtered.slice(0, LIMIT)));
    window.dispatchEvent(new Event("nexus.recentPatients.changed"));
  } catch {
    /* ignore */
  }
}

export function readRecentPatients(): RecentPatient[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
