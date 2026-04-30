import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
  SheetDescription, SheetFooter,
} from "@/components/ui/sheet"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus, Pencil, Trash2, Loader2, KanbanSquare, Search,
  ChevronLeft, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { apiClient, ApiClientError } from "@/lib/api-client"
import { useNavigate } from "react-router"

type Stage = "todo" | "in_progress" | "done" | "failed"

interface Process {
  id: string
  customerId: string
  customerName: string
  title: string
  description: string | null
  stage: Stage
  position: number
  createdAt: string
}

interface Customer {
  id: string
  firstName: string
  lastName: string
}

const STAGE_CONFIG: Record<Stage, { label: string; dot: string; className: string }> = {
  todo:        { label: "Başlandı",     dot: "bg-slate-400",   className: "bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-700" },
  in_progress: { label: "Devam Ediyor", dot: "bg-blue-500",    className: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800" },
  done:        { label: "Başarılı",     dot: "bg-emerald-500", className: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800" },
  failed:      { label: "Başarısız",    dot: "bg-red-500",     className: "bg-red-500/10 text-red-600 border-red-200 dark:border-red-800" },
}

const STAGE_ORDER: Stage[] = ["todo", "in_progress", "done", "failed"]

const FILTER_TABS: { value: "all" | Stage; label: string }[] = [
  { value: "all",         label: "Tümü" },
  { value: "in_progress", label: "Devam Ediyor" },
  { value: "todo",        label: "Başlandı" },
  { value: "done",        label: "Başarılı" },
  { value: "failed",      label: "Başarısız" },
]

const EMPTY_FORM = {
  customerId: "",
  title: "",
  description: "",
  stage: "todo" as Stage,
}

const PAGE_SIZE = 20

export default function Processes() {
  const navigate = useNavigate()
  const [processes, setProcesses] = useState<Process[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [stageFilter, setStageFilter] = useState<"all" | Stage>("all")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, stageFilter])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
        if (debouncedSearch) params.set("search", debouncedSearch)
        if (stageFilter !== "all") params.set("stage", stageFilter)

        const [procRes, custRes] = await Promise.all([
          apiClient.get<{ success: boolean; data: Process[]; pagination: { total: number } }>(`/api/processes?${params}`),
          apiClient.get<{ success: boolean; data: Customer[] }>("/api/customers?limit=200"),
        ])
        if (!cancelled) {
          setProcesses(procRes.data)
          setTotal(procRes.pagination?.total ?? procRes.data.length)
          setCustomers(custRes.data)
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof ApiClientError ? err.data.message : undefined
          toast.error(msg ?? "Veriler yüklenemedi")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [debouncedSearch, stageFilter, page])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  const openEdit = (p: Process) => {
    setEditingId(p.id)
    setForm({ customerId: p.customerId, title: p.title, description: p.description ?? "", stage: p.stage })
    setSheetOpen(true)
  }

  const handleSave = async () => {
    if (!form.customerId) { toast.error("Müşteri seçiniz"); return }
    if (!form.title.trim()) { toast.error("Başlık zorunludur"); return }
    setSaving(true)
    try {
      if (editingId) {
        const res = await apiClient.patch<{ success: boolean; data: Process }>(`/api/processes/${editingId}`, form)
        setProcesses(prev => prev.map(p => p.id === editingId ? res.data : p))
        toast.success("Süreç güncellendi")
      } else {
        const res = await apiClient.post<{ success: boolean; data: Process }>("/api/processes", form)
        setProcesses(prev => [res.data, ...prev])
        setTotal(t => t + 1)
        toast.success("Süreç oluşturuldu")
      }
      setSheetOpen(false)
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.data.message : undefined
      toast.error(msg ?? "İşlem başarısız")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await apiClient.delete(`/api/processes/${deleteId}`)
      setProcesses(prev => prev.filter(p => p.id !== deleteId))
      setTotal(t => t - 1)
      toast.success("Süreç silindi")
      setDeleteId(null)
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.data.message : undefined
      toast.error(msg ?? "Silinemedi")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Süreçler</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Yükleniyor..." : `${total} süreç`}
          </p>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="size-4" />
          Yeni Süreç
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Süreç veya müşteri ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 flex-wrap">
          {FILTER_TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStageFilter(value)}
              className={cn(
                "px-3 py-1 text-sm rounded-md font-medium transition-colors whitespace-nowrap",
                stageFilter === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Başlık</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Müşteri</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Aşama</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Tarih</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-muted-foreground">
                    <Loader2 className="size-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : processes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <KanbanSquare className="size-8 opacity-30" />
                      <p>{search ? "Arama sonucu bulunamadı" : "Henüz süreç yok"}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                processes.map(p => {
                  const cfg = STAGE_CONFIG[p.stage]
                  return (
                    <tr
                      key={p.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/customers/${p.customerId}`)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{p.title}</p>
                        {p.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground md:hidden mt-0.5">{p.customerName}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.customerName}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn("text-xs font-medium gap-1.5", cfg.className)}>
                          <span className={cn("size-1.5 rounded-full shrink-0", cfg.dot)} />
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell tabular-nums">
                        {new Date(p.createdAt).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(p)}>
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(p.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && processes.length > 0 && totalPages > 1 && (
          <div className="px-4 py-3 border-t bg-muted/20 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {total} kayıt içinden {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} arası
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="size-3.5" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Button key={p} variant={p === page ? "default" : "outline"} size="sm" className="h-7 w-7 p-0" onClick={() => setPage(p)}>
                  {p}
                </Button>
              ))}
              <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sheet — Ekle / Düzenle */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle>{editingId ? "Süreci Düzenle" : "Yeni Süreç"}</SheetTitle>
            <SheetDescription>
              {editingId ? "Süreç bilgilerini güncelleyin." : "Müşteri için yeni süreç başlatın."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label>Müşteri <span className="text-destructive">*</span></Label>
              <Select
                value={form.customerId}
                onValueChange={v => setForm(p => ({ ...p, customerId: v }))}
                disabled={!!editingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Müşteri seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Başlık <span className="text-destructive">*</span></Label>
              <Input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Süreç başlığı"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Açıklama</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Süreç hakkında notlar..."
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Aşama</Label>
              <Select value={form.stage} onValueChange={v => setForm(p => ({ ...p, stage: v as Stage }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGE_ORDER.map(s => (
                    <SelectItem key={s} value={s}>
                      <div className="flex items-center gap-2">
                        <span className={cn("size-2 rounded-full shrink-0", STAGE_CONFIG[s].dot)} />
                        {STAGE_CONFIG[s].label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => setSheetOpen(false)} disabled={saving}>İptal</Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-24">
              {saving ? <Loader2 className="size-4 animate-spin" /> : editingId ? "Güncelle" : "Oluştur"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Silme onayı */}
      <AlertDialog open={!!deleteId} onOpenChange={o => !o && !deleting && setDeleteId(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Süreç silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>Bu süreç kalıcı olarak silinecek, geri alınamaz.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-w-16"
            >
              {deleting ? <Loader2 className="size-4 animate-spin" /> : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
