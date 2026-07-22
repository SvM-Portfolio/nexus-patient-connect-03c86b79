import { useEffect, useState } from "react";
import { Sun, Moon, Contrast, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type Theme = "light" | "dark" | "hc" | "custom";
const STORAGE_KEY = "theme";
const CUSTOM_KEY = "theme-custom";
const THEME_CLASSES = ["dark", "hc", "custom"] as const;

type CustomColors = {
  background: string;
  foreground: string;
  card: string;
  primary: string;
  primaryForeground: string;
  accent: string;
};

const DEFAULT_CUSTOM: CustomColors = {
  background: "#F1F5F9",
  foreground: "#0F172A",
  card: "#FFFFFF",
  primary: "#0EA5E9",
  primaryForeground: "#FFFFFF",
  accent: "#E0F2FE",
};

function loadCustom(): CustomColors {
  if (typeof localStorage === "undefined") return DEFAULT_CUSTOM;
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return DEFAULT_CUSTOM;
    return { ...DEFAULT_CUSTOM, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CUSTOM;
  }
}

function applyCustomVars(c: CustomColors) {
  if (typeof document === "undefined") return;
  const r = document.documentElement.style;
  r.setProperty("--custom-background", c.background);
  r.setProperty("--custom-foreground", c.foreground);
  r.setProperty("--custom-card", c.card);
  r.setProperty("--custom-primary", c.primary);
  r.setProperty("--custom-primary-foreground", c.primaryForeground);
  r.setProperty("--custom-accent", c.accent);
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  THEME_CLASSES.forEach((c) => root.classList.remove(c));
  if (theme === "dark" || theme === "hc" || theme === "custom") {
    root.classList.add(theme);
  }
  if (theme === "custom") applyCustomVars(loadCustom());
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState<CustomColors>(DEFAULT_CUSTOM);

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "light";
    setTheme(stored);
    setCustom(loadCustom());
    applyTheme(stored);
  }, []);

  const update = (next: Theme) => {
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  };

  const updateCustom = (patch: Partial<CustomColors>) => {
    const next = { ...custom, ...patch };
    setCustom(next);
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
    applyCustomVars(next);
    if (theme !== "custom") update("custom");
  };

  const Icon =
    theme === "dark" ? Moon : theme === "hc" ? Contrast : theme === "custom" ? Palette : Sun;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Toggle theme">
            <Icon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => update("light")} data-active={theme === "light"}>
            <Sun className="mr-2 h-4 w-4" /> Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => update("dark")} data-active={theme === "dark"}>
            <Moon className="mr-2 h-4 w-4" /> Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => update("hc")} data-active={theme === "hc"}>
            <Contrast className="mr-2 h-4 w-4" /> High contrast
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => update("custom")} data-active={theme === "custom"}>
            <Palette className="mr-2 h-4 w-4" /> Custom
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCustomOpen(true)}>
            <Palette className="mr-2 h-4 w-4" /> Customize colors…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Custom theme</DialogTitle>
            <DialogDescription>
              Pick colors that reflect your workspace. Saved to this device and applied instantly.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            {(
              [
                ["primary", "Primary"],
                ["primaryForeground", "Primary text"],
                ["background", "Background"],
                ["foreground", "Text"],
                ["card", "Card"],
                ["accent", "Accent"],
              ] as Array<[keyof CustomColors, string]>
            ).map(([key, label]) => (
              <div key={key} className="flex items-center gap-3">
                <input
                  id={`color-${key}`}
                  type="color"
                  value={custom[key]}
                  onChange={(e) => updateCustom({ [key]: e.target.value } as Partial<CustomColors>)}
                  className="h-10 w-14 cursor-pointer rounded-md border border-input bg-transparent"
                  aria-label={label}
                />
                <div className="flex flex-col">
                  <Label htmlFor={`color-${key}`} className="text-sm">
                    {label}
                  </Label>
                  <span className="text-xs text-muted-foreground">{custom[key].toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCustom(DEFAULT_CUSTOM);
                localStorage.setItem(CUSTOM_KEY, JSON.stringify(DEFAULT_CUSTOM));
                applyCustomVars(DEFAULT_CUSTOM);
              }}
            >
              Reset
            </Button>
            <Button onClick={() => setCustomOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
