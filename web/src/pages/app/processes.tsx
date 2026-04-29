import { useState, useEffect } from "react"
import type { DragEvent } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Pencil, Trash2, Loader2, KanbanSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiClient, ApiClientError } from "@/lib/api-client"

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

const STAGES: Record<Stage, { label: string; accent: string; border: string; bg: string }> = {
  todo:        { label: "Başlandı",      accent: "bg-slate-400",   border: "border-slate-200 dark:border-slate-700",   bg: "bg-slate-50 dark:bg-slate-900/40" },
  in_progress: { label: "Devam Ediyor", accent: "bg-blue-500",    border: "border-blue-200 dark:border-blue-800",     bg: "bg-blue-50/50 dark:bg-blue-950/30" },
  done:        { label: "Başarılı",     accent: "bg-emerald-500", border: "border-emerald-200 dark:border-emerald-800", bg: "bg-emerald-50/50 dark:bg-emerald-950/30" },
  failed:      { label: "Başarısız",    accent: "bg-red-500",     border: "border-red-200 dark:border-red-800",       bg: "bg-red-50/50 dark:bg-red-950/30" },
}

const STAGE_ORDER: Stage[] = ["todo", "in_progress", "done", "failed"]

const EMPTY_FORM = {
  customerId: "",
  title: "",
  description: "",
  stage: "todo" as Stage,
}

export default function Processes() {
  const [processes, setProcesses] = useState<Process[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null)

  // Load data
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [procRes, custRes] = await Promise.all([
          apiClient.get<{ success: boolean; data: Process[] }>("/api/processes"),
          apiClient.get<{ success: boolean; data: Customer[] }>("/api/customers?limit=100"),
        ])
        if (!cancelled) {
          setProcesses(procRes.data)
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
  }, [])

  const byStage = (stage: Stage) =>
    processes.filter((p) => p.stage === stage).sort((a, b) => a.position - b.position)

  // Sheet helpers
  const openAdd = (stage: Stage = "todo") => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, stage })
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
        setProcesses((prev) => prev.map((p) => p.id === editingId ? res.data : p))
        toast.success("Süreç güncellendi")
      } else {
        const res = await apiClient.post<{ success: boolean; data: Process }>("/api/processes", form)
        setProcesses((prev) => [...prev, res.data])
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
      setProcesses((prev) => prev.filter((p) => p.id !== deleteId))
      toast.success("Süreç silindi")
      setDeleteId(null)
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.data.message : undefined
      toast.error(msg ?? "Silinemedi")
    } finally {
      setDeleting(false)
    }
  }

  // Drag & Drop
  const handleDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setDragOverStage(null)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>, stage: Stage) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverStage(stage)
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>, stage: Stage) => {
    e.preventDefault()
    setDragOverStage(null)
    if (!draggingId) return

    const process = processes.find((p) => p.id === draggingId)
    if (!process || process.stage === stage) { setDraggingId(null); return }

    // Optimistic update
    setProcesses((prev) => prev.map((p) => p.id === draggingId ? { ...p, stage } : p))
    setDraggingId(null)

    try {
      const res = await apiClient.patch<{ success: boolean; data: Process }>(`/api/processes/${draggingId}`, { stage })
      setProcesses((prev) => prev.map((p) => p.id === res.data.id ? res.data : p))
    } catch {
      // Revert on error
      setProcesses((prev) => prev.map((p) => p.id === draggingId ? { ...p, stage: process.stage } : p))
      toast.error("Aşama güncellenemedi")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Süreçler</h1>
          <p className="text-sm text-muted-foreground mt-1">{processes.length} süreç takip ediliyor</p>
        </div>
        <Button size="sm" onClick={() => openAdd()} className="gap-1.5">
          <Plus className="size-4" />
          Yeni Süreç
        </Button>
      </div>

      {/* Empty state */}
      {processes.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <KanbanSquare className="size-10 opacity-20" />
          <p className="text-sm">Henüz süreç yok</p>
          <Button variant="outline" size="sm" onClick={() => openAdd()}>
            <Plus className="size-4 mr-1.5" />
            İlk süreci oluştur
          </Button>
        </div>
      )}

      {/* Kanban Board */}
      {processes.length > 0 && (
      <div className="flex gap-4 overflow-x-auto pb-4 flex-1 items-start">
        {STAGE_ORDER.map((stage) => {
          const cfg = STAGES[stage]
          const cards = byStage(stage)
          const isOver = dragOverStage === stage

          return (
            <div
              key={stage}
              className="flex flex-col w-72 shrink-0"
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={(e) => handleDrop(e, stage)}
            >
              {/* Column header */}
              <div className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-t-xl border border-b-0",
                cfg.border, cfg.bg
              )}>
                <div className={cn("size-2.5 rounded-full shrink-0", cfg.accent)} />
                <span className="text-sm font-medium">{cfg.label}</span>
                <span className="ml-auto text-xs text-muted-foreground font-medium bg-background/80 rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {cards.length}
                </span>
              </div>

              {/* Cards area */}
              <div className={cn(
                "flex-1 rounded-b-xl border p-2 space-y-2 min-h-32 transition-colors",
                cfg.border, cfg.bg,
                isOver && "ring-2 ring-primary/40 ring-inset"
              )}>
                {cards.map((p) => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, p.id)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "bg-card rounded-lg border p-3 shadow-sm cursor-grab active:cursor-grabbing space-y-1.5 group transition-opacity",
                      draggingId === p.id && "opacity-40"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug">{p.title}</p>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(p.id)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-primary font-medium">{p.customerName}</p>

                    {p.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                    )}

                    <p className="text-xs text-muted-foreground/60">
                      {new Date(p.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                ))}

                {/* Empty state + add button */}
                {cards.length === 0 && !isOver && (
                  <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/50">
                    Kart yok
                  </div>
                )}

                <button
                  onClick={() => openAdd(stage)}
                  className="w-full flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-background/60 rounded-md px-2 py-1.5 transition-colors"
                >
                  <Plus className="size-3.5" />
                  Kart ekle
                </button>
              </div>
            </div>
          )
        })}
      </div>
      )}

      {/* Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle>{editingId ? "Süreci Düzenle" : "Yeni Süreç"}</SheetTitle>
            <SheetDescription>
              {editingId ? "Süreç bilgilerini güncelleyin." : "Bir müşteri için yeni süreç başlatın."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label>Müşteri <span className="text-destructive">*</span></Label>
              <Select
                value={form.customerId}
                onValueChange={(v) => setForm((p) => ({ ...p, customerId: v }))}
                disabled={!!editingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Müşteri seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
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
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Süreç başlığı"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Açıklama</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Süreç hakkında notlar..."
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Aşama</Label>
              <Select
                value={form.stage}
                onValueChange={(v) => setForm((p) => ({ ...p, stage: v as Stage }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      <div className="flex items-center gap-2">
                        <div className={cn("size-2 rounded-full", STAGES[s].accent)} />
                        {STAGES[s].label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => setSheetOpen(false)} disabled={saving}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-24">
              {saving ? <Loader2 className="size-4 animate-spin" /> : editingId ? "Güncelle" : "Oluştur"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Silme onayı */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && !deleting && setDeleteId(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Süreç silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu süreç kalıcı olarak silinecek, geri alınamaz.
            </AlertDialogDescription>
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
