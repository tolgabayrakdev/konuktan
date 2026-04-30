import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus, Phone, Mail, FileText, Pencil, Trash2,
  Loader2, Activity, HandshakeIcon,
  ChevronLeft, ChevronRight, Search, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { apiClient, ApiClientError } from "@/lib/api-client"

type ActivityType = "call" | "email" | "meeting" | "note" | "offer"

interface ActivityItem {
  id: string
  customerId: string
  customerName: string
  type: ActivityType
  title: string
  description: string | null
  happenedAt: string
  createdAt: string
}

interface Customer {
  id: string
  firstName: string
  lastName: string
}

const TYPE_CONFIG: Record<ActivityType, { label: string; icon: React.ElementType; className: string }> = {
  call:    { label: "Arama",    icon: Phone,          className: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800" },
  email:   { label: "E-posta",  icon: Mail,           className: "bg-violet-500/10 text-violet-600 border-violet-200 dark:border-violet-800" },
  meeting: { label: "Toplantı", icon: HandshakeIcon,  className: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800" },
  note:    { label: "Not",      icon: FileText,       className: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800" },
  offer:   { label: "Teklif",   icon: FileText,       className: "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800" },
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"))

function nowParts() {
  const d = new Date()
  return {
    date:   d.toISOString().slice(0, 10),
    hour:   String(d.getHours()).padStart(2, "0"),
    minute: String(Math.floor(d.getMinutes() / 5) * 5).padStart(2, "0"),
  }
}

const EMPTY_FORM = {
  customerId: "",
  type: "call" as ActivityType,
  title: "",
  description: "",
  ...nowParts(),
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit", minute: "2-digit",
  })
}

function groupByDate(items: ActivityItem[]) {
  const groups: Record<string, ActivityItem[]> = {}
  for (const item of items) {
    const day = new Date(item.happenedAt).toLocaleDateString("tr-TR", {
      day: "numeric", month: "long", year: "numeric",
    })
    if (!groups[day]) groups[day] = []
    groups[day].push(item)
  }
  return Object.entries(groups)
}

// Date range helpers
function startOfDay(d: Date) {
  const r = new Date(d); r.setHours(0, 0, 0, 0); return r
}
function endOfDay(d: Date) {
  const r = new Date(d); r.setHours(23, 59, 59, 999); return r
}
function startOfWeek(d: Date) {
  const r = new Date(d); const day = r.getDay(); const diff = r.getDate() - day + (day === 0 ? -6 : 1); r.setDate(diff); r.setHours(0, 0, 0, 0); return r
}
function endOfWeek(d: Date) {
  const r = startOfWeek(d); r.setDate(r.getDate() + 6); r.setHours(23, 59, 59, 999); return r
}
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999) }

const DATE_PRESETS = [
  { value: "today", label: "Bugün" },
  { value: "yesterday", label: "Dün" },
  { value: "tomorrow", label: "Yarın" },
  { value: "this_week", label: "Bu Hafta" },
  { value: "this_month", label: "Bu Ay" },
  { value: "all", label: "Tüm Zamanlar" },
]

function getDateRange(preset: string) {
  const now = new Date()
  switch (preset) {
    case "today": return { start: startOfDay(now), end: endOfDay(now) }
    case "yesterday": { const y = new Date(now); y.setDate(y.getDate() - 1); return { start: startOfDay(y), end: endOfDay(y) } }
    case "tomorrow": { const t = new Date(now); t.setDate(t.getDate() + 1); return { start: startOfDay(t), end: endOfDay(t) } }
    case "this_week": return { start: startOfWeek(now), end: endOfWeek(now) }
    case "this_month": return { start: startOfMonth(now), end: endOfMonth(now) }
    default: return null
  }
}

export default function Activities() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  const PAGE_SIZE = 50
  const [page, setPage] = useState(1)

  const [customerId, setCustomerId] = useState("")
  const [datePreset, setDatePreset] = useState("this_week")
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers
    const q = customerSearch.toLowerCase()
    return customers.filter(c =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q)
    )
  }, [customers, customerSearch])

  const selectedCustomer = useMemo(() =>
    customers.find(c => c.id === customerId),
    [customers, customerId]
  )

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
        if (customerId) params.set("customerId", customerId)
        const range = getDateRange(datePreset)
        if (range) {
          params.set("startDate", range.start.toISOString())
          params.set("endDate", range.end.toISOString())
        }
        const [actRes, cusRes] = await Promise.all([
          apiClient.get<{ success: boolean; data: ActivityItem[]; pagination: { total: number } }>(`/api/activities?${params}`),
          apiClient.get<{ success: boolean; data: Customer[] }>("/api/customers?limit=200"),
        ])
        if (!cancelled) {
          setActivities(actRes.data)
          setTotal(actRes.pagination.total)
          setCustomers(cusRes.data)
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
  }, [page, customerId, datePreset])

  useEffect(() => { setPage(1) }, [customerId, datePreset])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const grouped = useMemo(() => groupByDate(activities), [activities])

  const openAdd = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, ...nowParts(), customerId })
    setDialogOpen(true)
  }

  const openEdit = (a: ActivityItem) => {
    setEditingId(a.id)
    const d = new Date(a.happenedAt)
    setForm({
      customerId: a.customerId,
      type: a.type,
      title: a.title,
      description: a.description ?? "",
      date:   d.toISOString().slice(0, 10),
      hour:   String(d.getHours()).padStart(2, "0"),
      minute: String(Math.floor(d.getMinutes() / 5) * 5).padStart(2, "0"),
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.customerId) { toast.error("Müşteri seçiniz"); return }
    if (!form.title.trim()) { toast.error("Başlık zorunludur"); return }
    setSaving(true)
    try {
      const payload = {
        customerId: form.customerId,
        type: form.type,
        title: form.title,
        description: form.description || null,
        happenedAt: new Date(`${form.date}T${form.hour}:${form.minute}`).toISOString(),
      }
      if (editingId) {
        const res = await apiClient.patch<{ success: boolean; data: ActivityItem }>(`/api/activities/${editingId}`, payload)
        setActivities((prev) => prev.map((a) => a.id === editingId ? res.data : a))
        toast.success("Aktivite güncellendi")
      } else {
        const res = await apiClient.post<{ success: boolean; data: ActivityItem }>("/api/activities", payload)
        setActivities((prev) => [res.data, ...prev])
        setTotal(t => t + 1)
        toast.success("Aktivite eklendi")
      }
      setDialogOpen(false)
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
      await apiClient.delete(`/api/activities/${deleteId}`)
      setActivities((prev) => prev.filter((a) => a.id !== deleteId))
      setTotal(t => t - 1)
      toast.success("Aktivite silindi")
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
          <h1 className="text-2xl font-semibold tracking-tight">Aktiviteler</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Yükleniyor..." : `${total} aktivite kayıtlı`}
          </p>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="size-4" />
          Aktivite Ekle
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Customer selector */}
        <div className="relative">
          <button
            onClick={() => setCustomerDropdownOpen(!customerDropdownOpen)}
            className="flex items-center gap-2 h-9 px-3 rounded-lg border bg-background text-sm hover:bg-muted transition-colors min-w-48"
          >
            <Search className="size-3.5 text-muted-foreground shrink-0" />
            <span className={cn("truncate", !selectedCustomer && "text-muted-foreground")}>
              {selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : "Müşteri seç..."}
            </span>
            {customerId && (
              <X
                className="size-3.5 text-muted-foreground hover:text-foreground shrink-0"
                onClick={(e) => { e.stopPropagation(); setCustomerId(""); setCustomerDropdownOpen(false) }}
              />
            )}
          </button>

          {customerDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setCustomerDropdownOpen(false)} />
              <div className="absolute top-full left-0 mt-1 w-72 rounded-xl border bg-card shadow-lg z-50 overflow-hidden">
                <div className="p-2 border-b">
                  <Input
                    placeholder="Müşteri ara..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                  />
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {filteredCustomers.length === 0 ? (
                    <p className="px-3 py-4 text-xs text-muted-foreground text-center">Müşteri bulunamadı</p>
                  ) : (
                    filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2",
                          customerId === c.id && "bg-muted font-medium"
                        )}
                        onClick={() => { setCustomerId(c.id); setCustomerSearch(""); setCustomerDropdownOpen(false) }}
                      >
                        <div className="size-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center shrink-0">
                          {c.firstName[0]}{c.lastName[0]}
                        </div>
                        <span className="truncate">{c.firstName} {c.lastName}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Date presets */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {DATE_PRESETS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setDatePreset(value)}
              className={cn(
                "px-3 py-1 text-sm rounded-md font-medium transition-colors",
                datePreset === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-muted-foreground">
          <Activity className="size-8 opacity-30" />
          <p>{customerId ? "Bu müşteri için aktivite bulunamadı" : "Bu tarih aralığında aktivite yok"}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([day, items]) => (
            <div key={day}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-semibold">{day}</span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{items.length} aktivite</span>
              </div>
              <div className="space-y-2">
                {items.map((a) => {
                  const cfg = TYPE_CONFIG[a.type]
                  const Icon = cfg.icon
                  return (
                    <div
                      key={a.id}
                      className="flex gap-4 items-start rounded-xl border bg-card p-4 hover:bg-muted/30 transition-colors group"
                    >
                      <div className={cn("mt-0.5 size-8 rounded-full border flex items-center justify-center shrink-0", cfg.className)}>
                        <Icon className="size-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{a.title}</span>
                          <Badge variant="outline" className={cn("text-xs font-medium", cfg.className)}>
                            {cfg.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground tabular-nums">{formatTime(a.happenedAt)}</span>
                        </div>
                        {!customerId && (
                          <p className="text-xs text-muted-foreground mt-0.5">{a.customerName}</p>
                        )}
                        {a.description && (
                          <p className="text-sm text-muted-foreground mt-1.5 whitespace-pre-wrap line-clamp-2">{a.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(a)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(a.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && activities.length > 0 && (
        <div className="flex items-center justify-between border-t pt-4">
          <span className="text-xs text-muted-foreground">
            {total} kayıt içinden {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} arası gösteriliyor
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="sm" className="h-7 w-7 p-0"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p <= 5 || p === totalPages).map((p, idx, arr) => (
              <span key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-muted-foreground">…</span>}
                <Button
                  variant={p === page ? "default" : "outline"}
                  size="sm" className="h-7 w-7 p-0"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              </span>
            ))}
            <Button
              variant="outline" size="sm" className="h-7 w-7 p-0"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog — Ekle / Düzenle */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !saving && setDialogOpen(o)}>
        <DialogContent showCloseButton={false} className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Aktiviteyi Düzenle" : "Yeni Aktivite"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Aktivite bilgilerini güncelleyin." : "Müşteri ile yaşanan etkileşimi kaydedin."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Müşteri <span className="text-destructive">*</span></Label>
              <Select value={form.customerId} onValueChange={(v) => setForm((p) => ({ ...p, customerId: v }))}>
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

            {/* Tür */}
            <div className="space-y-1.5">
              <Label>Tür <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-5 gap-2">
                {(Object.entries(TYPE_CONFIG) as [ActivityType, typeof TYPE_CONFIG[ActivityType]][]).map(([value, cfg]) => {
                  const Icon = cfg.icon
                  const selected = form.type === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, type: value }))}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border py-2 px-1.5 text-xs font-medium transition-all",
                        selected
                          ? cn(cfg.className, "ring-2 ring-offset-1 ring-current")
                          : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <div className={cn(
                        "size-5 rounded-full flex items-center justify-center border",
                        selected ? cfg.className : "bg-muted border-border"
                      )}>
                        <Icon className="size-3" />
                      </div>
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tarih ve Saat */}
            <div className="space-y-1.5">
              <Label>Tarih ve Saat <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full"
                />
                <Select value={form.hour} onValueChange={(v) => setForm((p) => ({ ...p, hour: v }))}>
                  <SelectTrigger><SelectValue placeholder="Saat" /></SelectTrigger>
                  <SelectContent className="max-h-52">
                    {HOURS.map((h) => (<SelectItem key={h} value={h}>{h}:00</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={form.minute} onValueChange={(v) => setForm((p) => ({ ...p, minute: v }))}>
                  <SelectTrigger><SelectValue placeholder="Dakika" /></SelectTrigger>
                  <SelectContent className="max-h-52">
                    {MINUTES.map((m) => (<SelectItem key={m} value={m}>:{m}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Başlık <span className="text-destructive">*</span></Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Örn: İlk görüşme yapıldı"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Açıklama</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Görüşme detayları, notlar..."
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>İptal</Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-24">
              {saving ? <Loader2 className="size-4 animate-spin" /> : editingId ? "Güncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Silme onayı */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && !deleting && setDeleteId(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Aktivite silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>Bu işlem geri alınamaz.</AlertDialogDescription>
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
