import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Plus,
  Search,
  Users,
  Eye,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  searchPatients,
  displayName,
  sanitizeName,
  sanitizeGiven,
  type Gender,
}  from "@/lib/fhir";
import { GenderBadge } from "@/components/GenderBadge";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { readRecentPatients, type RecentPatient } from "@/lib/recent-patients";


export const Route = createFileRoute("/patients/")({
  head: () => ({
    meta: [
      { title: "Nexus Pro — Patient Management" },
      {
        name: "description",
        content:
          "Nexus Pro: manage FHIR R4 patients — search, filter, sort, and edit patient records via your FHIR server.",
      },
      { property: "og:title", content: "Nexus Pro — Patient Management" },
      {
        property: "og:description",
        content: "Manage FHIR R4 patients: search, filter, sort, and edit records.",
      },
    ],
  }),
  component: PatientsPage,
});

const PAGE_SIZE = 10;

type SortField = "given" | "family";

function PatientsPage() {
  // quick search
  const [quickInput, setQuickInput] = useState("");
  const [quick, setQuick] = useState("");

  // advanced filters
  const [givenF, setGivenF] = useState("");
  const [familyF, setFamilyF] = useState("");
  const [birthdateF, setBirthdateF] = useState("");
  const [genderF, setGenderF] = useState<Gender | "all">("all");

  const [appliedFilters, setAppliedFilters] = useState({
    given: "",
    family: "",
    birthdate: "",
    gender: "" as Gender | "",
  });

  // sort
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const sortParam = sortField
    ? `${sortDir === "desc" ? "-" : ""}${sortField}`
    : undefined;

  // pagination
  const [offset, setOffset] = useState(0);

  const queryKey = useMemo(
    () => [
      "patients",
      { quick, appliedFilters, sortParam, offset, count: PAGE_SIZE },
    ],
    [quick, appliedFilters, sortParam, offset],
  );

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      searchPatients({
        offset,
        count: PAGE_SIZE,
        sort: sortParam,
        name: quick,
        given: appliedFilters.given,
        family: appliedFilters.family,
        gender: appliedFilters.gender,
        birthdate: appliedFilters.birthdate,
      }),
  });


  const toggleSort = (f: SortField) => {
    if (sortField !== f) {
      setSortField(f);
      setSortDir("asc");
    } else if (sortDir === "asc") setSortDir("desc");
    else {
      setSortField(null);
    }
    setOffset(0);
  };

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFilters({
      given: givenF,
      family: familyF,
      birthdate: birthdateF,
      gender: genderF === "all" ? "" : genderF,
    });
    setOffset(0);
  };

  const clearFilters = () => {
    setGivenF("");
    setFamilyF("");
    setBirthdateF("");
    setGenderF("all");
    setAppliedFilters({ given: "", family: "", birthdate: "", gender: "" });
    setOffset(0);
  };

  const submitQuick = (e: React.FormEvent) => {
    e.preventDefault();
    setQuick(quickInput);
    setOffset(0);
  };

  // Recent visits (from local storage) — used to surface last-visited timestamp
  // and float recently-visited patients to the top of the current page.
  const [recent, setRecent] = useState<RecentPatient[]>([]);
  useEffect(() => {
    setRecent(readRecentPatients());
    const onChange = () => setRecent(readRecentPatients());
    window.addEventListener("nexus.recentPatients.changed", onChange);
    return () => window.removeEventListener("nexus.recentPatients.changed", onChange);
  }, []);
  const visitedAtById = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of recent) m.set(r.id, r.visitedAt);
    return m;
  }, [recent]);

  const rawPatients = data?.patients ?? [];
  const patients = useMemo(() => {
    const arr = [...rawPatients];
    arr.sort((a, b) => {
      const av = a.id ? visitedAtById.get(a.id) ?? 0 : 0;
      const bv = b.id ? visitedAtById.get(b.id) ?? 0 : 0;
      return bv - av;
    });
    return arr;
  }, [rawPatients, visitedAtById]);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const firstOnPage = total === 0 ? 0 : offset + 1;
  const lastOnPage = Math.min(offset + patients.length, total);

  const sortIcon = (f: SortField) => {
    if (sortField !== f) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-50" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3" />
    );
  };

  return (
    <div>
      <Toaster />
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
            <p className="mt-1 text-sm text-muted-foreground">FHIR R4 patient directory</p>
          </div>
          <Button asChild>
            <Link to="/patients/new">
              <Plus className="mr-2 h-4 w-4" /> New patient
            </Link>
          </Button>
        </div>
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Directory</CardTitle>
              <form onSubmit={submitQuick} className="flex w-full gap-2 sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={quickInput}
                    onChange={(e) => setQuickInput(e.target.value)}
                    placeholder="Quick search (name)"
                    className="pl-9"
                  />
                </div>
                <Button type="submit" variant="secondary" disabled={isFetching}>
                  Search
                </Button>
                {quick && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setQuickInput("");
                      setQuick("");
                      setOffset(0);
                    }}
                  >
                    Clear
                  </Button>
                )}
              </form>
            </div>

            <form
              onSubmit={applyFilters}
              className="grid gap-3 rounded-md border bg-muted/30 p-3 md:grid-cols-5"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium">Given name</label>
                <Input
                  value={givenF}
                  onChange={(e) => setGivenF(e.target.value)}
                  placeholder="Jane"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Family name</label>
                <Input
                  value={familyF}
                  onChange={(e) => setFamilyF(e.target.value)}
                  placeholder="Doe"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Date of birth</label>
                <Input
                  type="date"
                  value={birthdateF}
                  onChange={(e) => setBirthdateF(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Gender</label>
                <Select
                  value={genderF}
                  onValueChange={(v) => setGenderF(v as Gender | "all")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" className="flex-1" disabled={isFetching}>
                  Apply
                </Button>
                <Button type="button" variant="outline" onClick={clearFilters}>
                  Reset
                </Button>
              </div>
            </form>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Failed to load patients</AlertTitle>
                <AlertDescription>{(error as Error).message}</AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading patients...
              </div>
            ) : patients.length === 0 && !error ? (
              <div className="py-16 text-center text-muted-foreground">
                No patients found.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <caption className="sr-only">
                    Patient directory — {total.toLocaleString()} records, page {currentPage} of {totalPages}
                  </caption>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        scope="col"
                        aria-sort={
                          sortField === "given"
                            ? sortDir === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                      >
                        <button
                          type="button"
                          className="flex items-center rounded-sm hover:text-foreground"
                          onClick={() => toggleSort("given")}
                          aria-label={`Sort by given name${
                            sortField === "given"
                              ? sortDir === "asc"
                                ? ", currently ascending"
                                : ", currently descending"
                              : ""
                          }`}
                        >
                          Given name {sortIcon("given")}
                        </button>
                      </TableHead>
                      <TableHead
                        scope="col"
                        aria-sort={
                          sortField === "family"
                            ? sortDir === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                      >
                        <button
                          type="button"
                          className="flex items-center rounded-sm hover:text-foreground"
                          onClick={() => toggleSort("family")}
                          aria-label={`Sort by family name${
                            sortField === "family"
                              ? sortDir === "asc"
                                ? ", currently ascending"
                                : ", currently descending"
                              : ""
                          }`}
                        >
                          Family name {sortIcon("family")}
                        </button>
                      </TableHead>
                      <TableHead scope="col">Gender</TableHead>
                      <TableHead scope="col">Date of birth</TableHead>
                      <TableHead scope="col">Last visited</TableHead>
                      <TableHead scope="col" className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((p) => (
                      <TableRow
                        key={p.id}
                        className="focus-within:bg-accent/60 focus-within:outline focus-within:outline-2 focus-within:outline-primary"
                      >
                        <TableCell>{sanitizeGiven(p.name?.[0]?.given) || "—"}</TableCell>
                        <TableCell className="font-medium">
                          {sanitizeName(p.name?.[0]?.family) || "—"}
                        </TableCell>
                        <TableCell>
                          <GenderBadge gender={p.gender} />
                        </TableCell>
                        <TableCell>{p.birthDate || "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="text-foreground"
                          >
                            <Link
                              to="/patients/$id"
                              params={{ id: p.id! }}
                              aria-label={`View record for ${displayName(p)}`}
                            >
                              <Eye className="mr-1 h-4 w-4" aria-hidden="true" />
                              <span>View Record</span>
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Footer bar */}
            <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <div className="flex flex-col text-sm text-muted-foreground sm:flex-row sm:gap-4">
                <span>
                  {firstOnPage === 0
                    ? "0 records"
                    : `${firstOnPage}–${lastOnPage} of ${total.toLocaleString()} records`}
                </span>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setOffset(0)}
                  disabled={offset === 0 || isFetching}
                  aria-label="First page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                  disabled={offset === 0 || isFetching}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const n = Math.max(1, Math.min(totalPages, Number(e.target.value) || 1));
                    setOffset((n - 1) * PAGE_SIZE);
                  }}
                  className="h-9 w-16 text-center"
                  aria-label="Jump to page"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                  disabled={currentPage >= totalPages || isFetching}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setOffset((totalPages - 1) * PAGE_SIZE)}
                  disabled={currentPage >= totalPages || isFetching}
                  aria-label="Last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

    </div>
  );
}
