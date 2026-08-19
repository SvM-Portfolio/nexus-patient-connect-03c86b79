import { useEffect, useState, useCallback } from "react";

export type Role =
  | "physician"
  | "front-office"
  | "rn"
  | "admin"
  | "developer";

export type RoleKind = "clinical" | "technical";

export const ROLES: {
  id: Role;
  label: string;
  path: string;
  kind: RoleKind;
  note?: string;
}[] = [
  { id: "physician", label: "Physician", path: "/dashboard/physician", kind: "clinical" },
  {
    id: "front-office",
    label: "Front Office",
    path: "/dashboard/front-office",
    kind: "clinical",
  },
  {
    id: "rn",
    label: "RN",
    path: "/dashboard/physician",
    kind: "clinical",
    note: "Dashboard coming soon",
  },
  { id: "admin", label: "Admin", path: "/admin", kind: "technical" },
  { id: "developer", label: "Developer", path: "/admin/developer", kind: "technical" },
];

export const TECHNICAL_ROLES: Role[] = ["admin", "developer"];

const KEY = "nexus.activeRole";
const DEFAULT: Role = "physician";

const VALID = new Set<string>(ROLES.map((r) => r.id));

function read(): Role {
  if (typeof window === "undefined") return DEFAULT;
  const v = window.localStorage.getItem(KEY);
  return v && VALID.has(v) ? (v as Role) : DEFAULT;
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

  return {
    role,
    setRole,
    dashboardPath: activeRoleMeta.path,
    roles: ROLES,
    isTechnical: TECHNICAL_ROLES.includes(role),
  };
}

export function getActiveRolePath(): string {
  const r = read();
  return ROLES.find((x) => x.id === r)?.path ?? ROLES[0].path;
}
