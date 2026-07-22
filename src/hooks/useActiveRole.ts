import { useEffect, useState, useCallback } from "react";

export type Role = "physician" | "front-office";

export const ROLES: { id: Role; label: string; path: string }[] = [
  { id: "physician", label: "Physician", path: "/dashboard/physician" },
  { id: "front-office", label: "Front Office", path: "/dashboard/front-office" },
];

const KEY = "nexus.activeRole";
const DEFAULT: Role = "physician";

function read(): Role {
  if (typeof window === "undefined") return DEFAULT;
  const v = window.localStorage.getItem(KEY);
  return v === "physician" || v === "front-office" ? v : DEFAULT;
}

export function useActiveRole() {
  const [role, setRoleState] = useState<Role>(DEFAULT);

  useEffect(() => {
    setRoleState(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setRoleState(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setRole = useCallback((r: Role) => {
    window.localStorage.setItem(KEY, r);
    setRoleState(r);
    // notify other listeners in this tab
    window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: r }));
  }, []);

  const activeRoleMeta = ROLES.find((r) => r.id === role) ?? ROLES[0];

  return { role, setRole, dashboardPath: activeRoleMeta.path, roles: ROLES };
}

export function getActiveRolePath(): string {
  const r = read();
  return ROLES.find((x) => x.id === r)?.path ?? ROLES[0].path;
}
