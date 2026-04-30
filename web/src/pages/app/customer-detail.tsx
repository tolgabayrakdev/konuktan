import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft, Pencil, Trash2, Loader2, Plus, Phone, Mail, FileText,
  CalendarDays, HandshakeIcon, Activity, KanbanSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { apiClient, ApiClientError } from "@/lib/api-client"

// ─── Types ────────────────────────────────────────────────────────────

type Status = "active" | "inactive" | "lead"
type Stage  = "todo" | "in_progress" | "done" | "failed"
type ActivityType = "call" | "email" | "meeting" | "note" | "offer"

interface Customer {
  id: string; firstName: string; lastName: string
  email: string | null; phone: string | null
  company: string | null; city: string | null
  status: Status; notes: string | null
  createdAt: string; updatedAt: string
}

interface Process {
  id: string; customerId: string; customerName: string
  title: string; description: string | null
  stage: Stage; position: number; createdAt: string
}

interface ActivityItem {
  id: string; customerId: string; customerName: string
  type: ActivityType; title: string; description: string | null
  happenedAt: string; createdAt: string
}

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  active:   { label: "Aktif", className: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800" },
  inactive: { label: "Pasif", className: "bg-muted text-muted-foreground border-border" },
  lead:     { label: "Aday",  className: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800" },
}

const STAGES: Record<Stage, { label: string; accent: string }> = {
  todo:        { label: "Başlandı",     accent: "bg-slate-400" },
  in_progress: { label: "Devam Ediyor", accent: "bg-blue-500" },
  done:        { label: "Başarılı",     accent: "bg-emerald-500" },
  failed:      { label: "Başarısız",    accent: "bg-red-500" },
}
const STAGE_ORDER: Stage[] = ["todo", "in_progress", "done", "failed"]

const TYPE_CONFIG: Record<ActivityType, { label: string; icon: React.ElementType; className: string }> = {
  call:    { label: "Arama",    icon: Phone,         className: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800" },
  email:   { label: "E-posta",  icon: Mail,          className: "bg-violet-500/10 text-violet-600 border-violet-200 dark:border-violet-800" },
  meeting: { label: "Toplantı", icon: HandshakeIcon, className: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800" },
  note:    { label: "Not",      icon: FileText,      className: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800" },
  offer:   { label: "Teklif",   icon: FileText,      className: "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800" },
}

// ─── Date helpers ─────────────────────────────────────────────────────

const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"))

function nowParts() {
  const d = new Date()
  return {
    date:   d.toISOString().slice(0, 10),
    hour:   String(d.getHours()).padStart(2, "0"),
    minute: String(Math.floor(d.getMinutes() / 5) * 5).padStart(2, "0"),
  }
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 4) return digits
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
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

// ─── Forms ────────────────────────────────────────────────────────────

const EMPTY_CUSTOMER_FORM = {
  firstName: "", lastName: "", email: "", phone: "",
  company: "", city: "", status: "lead" as Status, notes: "",
}

const EMPTY_ACTIVITY_FORM = {
  type: "call" as ActivityType, title: "", description: "",
  ...nowParts(),
}

const EMPTY_PROCESS_FORM = { title: "", description: "", stage: "todo" as Stage }

// ─── InfoRow: tek satır müşteri bilgisi ──────────────────────────────

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-xs uppercase tracking-wide text-muted-foreground/70 font-medium">{label}</span>
      <span className="text-sm truncate">{value || <span className="text-muted-foreground/60">—</span>}</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [customer, setCustomer]     = useState<Customer | null>(null)
  const [processes, setProcesses]   = useState<Process[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  const [editCustomerOpen, setEditCustomerOpen] = useState(false)
  const [customerForm, setCustomerForm]         = useState(EMPTY_CUSTOMER_FORM)
  const [savingCustomer, setSavingCustomer]     = useState(false)
  const [phoneError, setPhoneError]             = useState(false)

  const [deleteCustomerOpen, setDeleteCustomerOpen] = useState(false)
  const [deletingCustomer, setDeletingCustomer]     = useState(false)

  const [activityDialogOpen, setActivityDialogOpen] = useState(false)
  const [editingActivityId, setEditingActivityId]   = useState<string | null>(null)
  const [activityForm, setActivityForm]             = useState(EMPTY_ACTIVITY_FORM)
  const [savingActivity, setSavingActivity]         = useState(false)
  const [deleteActivityId, setDeleteActivityId]     = useState<string | null>(null)
  const [deletingActivity, setDeletingActivity]     = useState(false)

  const [processDialogOpen, setProcessDialogOpen] = useState(false)
  const [editingProcessId, setEditingProcessId]   = useState<string | null>(null)
  const [processForm, setProcessForm]             = useState(EMPTY_PROCESS_FORM)
  const [savingProcess, setSavingProcess]         = useState(false)
  const [deleteProcessId, setDeleteProcessId]     = useState<string | null>(null)
  const [deletingProcess, setDeletingProcess]     = useState(false)

  // ── Veriyi yükle ────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [cusRes, actRes, procRes] = await Promise.all([
          apiClient.get<{ success: boolean; data: Customer }>(`/api/customers/${id}`),
          apiClient.get<{ success: boolean; data: ActivityItem[] }>(`/api/activities?customerId=${id}&limit=100`),
          apiClient.get<{ success: boolean; data: Process[] }>(`/api/processes?customerId=${id}`),
        ])
        if (!cancelled) {
          setCustomer(cusRes.data); setActivities(actRes.data); setProcesses(procRes.data)
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof ApiClientError ? err.data.message : "Müşteri bulunamadı")
          navigate("/customers")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  // ── Müşteri ──────────────────────────────────────────────────────────

  const openEditCustomer = () => {
    if (!customer) return
    setCustomerForm({
      firstName: customer.firstName, lastName: customer.lastName,
      email: customer.email ?? "", phone: customer.phone ?? "",
      company: customer.company ?? "", city: customer.city ?? "",
      status: customer.status, notes: customer.notes ?? "",
    })
    setPhoneError(false); setEditCustomerOpen(true)
  }

  const handleSaveCustomer = async () => {
    if (!customerForm.firstName.trim() || !customerForm.lastName.trim()) {
      toast.error("Ad ve soyad zorunludur"); return
    }
    if (customerForm.phone) {
      const digits = customerForm.phone.replace(/\D/g, "")
      if (digits.length !== 11) { setPhoneError(true); toast.error("Telefon 11 haneli olmalıdır"); return }
    }
    setPhoneError(false); setSavingCustomer(true)
    try {
      const res = await apiClient.patch<{ success: boolean; data: Customer }>(`/api/customers/${id}`, customerForm)
      setCustomer(res.data); setEditCustomerOpen(false)
      toast.success("Müşteri güncellendi")
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.data.message : "Güncellenemedi")
    } finally { setSavingCustomer(false) }
  }

  const handleDeleteCustomer = async () => {
    setDeletingCustomer(true)
    try {
      await apiClient.delete(`/api/customers/${id}`)
      toast.success("Müşteri silindi"); navigate("/customers")
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.data.message : "Silinemedi")
      setDeletingCustomer(false)
    }
  }

  // ── Aktivite ─────────────────────────────────────────────────────────

  const openAddActivity = () => {
    setEditingActivityId(null)
    setActivityForm({ ...EMPTY_ACTIVITY_FORM, ...nowParts() })
    setActivityDialogOpen(true)
  }

  const openEditActivity = (a: ActivityItem) => {
    setEditingActivityId(a.id)
    const d = new Date(a.happenedAt)
    setActivityForm({
      type: a.type, title: a.title, description: a.description ?? "",
      date:   d.toISOString().slice(0, 10),
      hour:   String(d.getHours()).padStart(2, "0"),
      minute: String(Math.floor(d.getMinutes() / 5) * 5).padStart(2, "0"),
    })
    setActivityDialogOpen(true)
  }

  const handleSaveActivity = async () => {
    if (!activityForm.title.trim()) { toast.error("Başlık zorunludur"); return }
    setSavingActivity(true)
    try {
      const payload = {
        customerId: id, type: activityForm.type, title: activityForm.title,
        description: activityForm.description || null,
        happenedAt: new Date(`${activityForm.date}T${activityForm.hour}:${activityForm.minute}`).toISOString(),
      }
      if (editingActivityId) {
        const res = await apiClient.patch<{ success: boolean; data: ActivityItem }>(`/api/activities/${editingActivityId}`, payload)
        setActivities((prev) => prev.map((a) => a.id === editingActivityId ? res.data : a))
        toast.success("Aktivite güncellendi")
      } else {
        const res = await apiClient.post<{ success: boolean; data: ActivityItem }>("/api/activities", payload)
        setActivities((prev) => [res.data, ...prev])
        toast.success("Aktivite eklendi")
      }
      setActivityDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.data.message : "İşlem başarısız")
    } finally { setSavingActivity(false) }
  }

  const handleDeleteActivity = async () => {
    if (!deleteActivityId) return
    setDeletingActivity(true)
    try {
      await apiClient.delete(`/api/activities/${deleteActivityId}`)
      setActivities((prev) => prev.filter((a) => a.id !== deleteActivityId))
      toast.success("Aktivite silindi"); setDeleteActivityId(null)
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.data.message : "Silinemedi")
    } finally { setDeletingActivity(false) }
  }

  // ── Süreç ────────────────────────────────────────────────────────────

  const openAddProcess = () => {
    setEditingProcessId(null)
    setProcessForm(EMPTY_PROCESS_FORM)
    setProcessDialogOpen(true)
  }

  const openEditProcess = (p: Process) => {
    setEditingProcessId(p.id)
    setProcessForm({ title: p.title, description: p.description ?? "", stage: p.stage })
    setProcessDialogOpen(true)
  }

  const handleSaveProcess = async () => {
    if (!processForm.title.trim()) { toast.error("Başlık zorunludur"); return }
    setSavingProcess(true)
    try {
      if (editingProcessId) {
        const res = await apiClient.patch<{ success: boolean; data: Process }>(`/api/processes/${editingProcessId}`, processForm)
        setProcesses((prev) => prev.map((p) => p.id === editingProcessId ? res.data : p))
        toast.success("Süreç güncellendi")
      } else {
        const res = await apiClient.post<{ success: boolean; data: Process }>("/api/processes", { ...processForm, customerId: id })
        setProcesses((prev) => [...prev, res.data])
        toast.success("Süreç oluşturuldu")
      }
      setProcessDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.data.message : "İşlem başarısız")
    } finally { setSavingProcess(false) }
  }

  const handleDeleteProcess = async () => {
    if (!deleteProcessId) return
    setDeletingProcess(true)
    try {
      await apiClient.delete(`/api/processes/${deleteProcessId}`)
      setProcesses((prev) => prev.filter((p) => p.id !== deleteProcessId))
      toast.success("Süreç silindi"); setDeleteProcessId(null)
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.data.message : "Silinemedi")
    } finally { setDeletingProcess(false) }
  }

  // ── Render ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!customer) return null

  const statusCfg = STATUS_CONFIG[customer.status]
  const groupedActivities = groupByDate(activities)
  const openCount = processes.filter(p => p.stage !== "done" && p.stage !== "failed").length
  const doneCount = processes.filter(p => p.stage === "done").length

  return (
    <div className="p-8 space-y-6">

      {/* ── Üst başlık ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="size-8 shrink-0" asChild>
            <Link to="/customers"><ArrowLeft className="size-4" /></Link>
          </Button>
          <div className="min-w-0">
            <Link to="/customers" className="text-xs text-muted-foreground hover:text-foreground">Müşteriler</Link>
            <div className="flex items-center gap-2.5 flex-wrap mt-0.5">
              <h1 className="text-2xl font-semibold tracking-tight truncate">
                {customer.firstName} {customer.lastName}
              </h1>
              <Badge variant="outline" className={cn("text-xs font-medium", statusCfg.className)}>
                {statusCfg.label}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={openEditCustomer}>
            <Pencil className="size-3.5" />
            Düzenle
          </Button>
          <Button
            variant="outline" size="sm"
            className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            onClick={() => setDeleteCustomerOpen(true)}
          >
            <Trash2 className="size-3.5" />
            Sil
          </Button>
        </div>
      </div>

      {/* ── Bilgi şeridi ─────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card divide-y">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-4 px-5 py-4">
          <InfoRow label="E-posta" value={customer.email} />
          <InfoRow label="Telefon" value={customer.phone} />
          <InfoRow label="Şirket"  value={customer.company} />
          <InfoRow label="Şehir"   value={customer.city} />
          <InfoRow label="Kayıt"   value={new Date(customer.createdAt).toLocaleDateString("tr-TR")} />
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70 font-medium">Aktivite</p>
              <p className="text-sm font-semibold tabular-nums">{activities.length}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70 font-medium">Süreç</p>
              <p className="text-sm font-semibold tabular-nums">{openCount}<span className="text-muted-foreground/60 font-normal">/{processes.length}</span></p>
            </div>
          </div>
        </div>
        {customer.notes && (
          <div className="px-5 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground/70 font-medium mb-1">Notlar</p>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{customer.notes}</p>
          </div>
        )}
      </div>

        {/* ── İçerik: Süreçler + Aktiviteler ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Süreçler ───────────────────────────────────────────────── */}
        <section className="rounded-xl border bg-card flex flex-col max-h-[600px]">
          <div className="flex items-center justify-between px-5 py-3.5 border-b shrink-0">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-semibold">Süreçler</h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                {openCount} açık · {doneCount} tamamlandı
              </span>
            </div>
            <Button size="sm" variant="ghost" className="gap-1 h-7 text-xs -mr-2" onClick={openAddProcess}>
              <Plus className="size-3.5" />
              Ekle
            </Button>
          </div>

          {processes.length === 0 ? (
            <div className="px-5 py-12 flex flex-col items-center gap-2 text-muted-foreground">
              <KanbanSquare className="size-6 opacity-30" />
              <p className="text-sm">Henüz süreç yok</p>
            </div>
          ) : (
            <div className="divide-y overflow-y-auto flex-1">
              {STAGE_ORDER.map((stage) => {
                const cards = processes.filter(p => p.stage === stage).sort((a, b) => a.position - b.position)
                if (cards.length === 0) return null
                const cfg = STAGES[stage]
                return (
                  <div key={stage} className="px-5 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn("size-1.5 rounded-full", cfg.accent)} />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{cfg.label}</span>
                      <span className="text-xs text-muted-foreground/60 tabular-nums">{cards.length}</span>
                    </div>
                    <div className="space-y-1">
                      {cards.map((p) => (
                        <div key={p.id} className="rounded-md px-2 py-2 flex items-start justify-between gap-2 group hover:bg-muted/50 transition-colors -mx-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-snug">{p.title}</p>
                            {p.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{p.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button variant="ghost" size="icon" className="size-6" onClick={() => openEditProcess(p)}>
                              <Pencil className="size-3" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="size-6 hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteProcessId(p.id)}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Aktiviteler ────────────────────────────────────────────── */}
        <section className="rounded-xl border bg-card flex flex-col max-h-[600px]">
          <div className="flex items-center justify-between px-5 py-3.5 border-b shrink-0">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-semibold">Aktiviteler</h2>
              <span className="text-xs text-muted-foreground tabular-nums">{activities.length} kayıt</span>
            </div>
            <Button size="sm" variant="ghost" className="gap-1 h-7 text-xs -mr-2" onClick={openAddActivity}>
              <Plus className="size-3.5" />
              Ekle
            </Button>
          </div>

          {activities.length === 0 ? (
            <div className="px-5 py-12 flex flex-col items-center gap-2 text-muted-foreground">
              <Activity className="size-6 opacity-30" />
              <p className="text-sm">Henüz aktivite yok</p>
            </div>
          ) : (
            <div className="px-5 py-3 space-y-5 overflow-y-auto flex-1">
              {groupedActivities.map(([day, items]) => (
                <div key={day}>
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDays className="size-3 text-muted-foreground/70 shrink-0" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{day}</span>
                  </div>
                  <div className="space-y-2 ml-5 border-l pl-4">
                    {items.map((a) => {
                      const cfg = TYPE_CONFIG[a.type]
                      const Icon = cfg.icon
                      return (
                        <div key={a.id} className="flex gap-3 items-start group relative">
                          <div className={cn("absolute -left-[26px] size-5 rounded-full border-2 border-card flex items-center justify-center shrink-0", cfg.className)}>
                            <Icon className="size-2.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">{a.title}</span>
                              <span className="text-xs text-muted-foreground/70 tabular-nums">{formatDateTime(a.happenedAt)}</span>
                            </div>
                            {a.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap line-clamp-2">{a.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button variant="ghost" size="icon" className="size-6" onClick={() => openEditActivity(a)}>
                              <Pencil className="size-3" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="size-6 hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteActivityId(a.id)}
                            >
                              <Trash2 className="size-3" />
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
        </section>
      </div>

      {/* ════════════════ DIALOGLAR ════════════════ */}

      {/* ── Müşteri Düzenle ─────────────────────────────────────────── */}
      <Dialog open={editCustomerOpen} onOpenChange={(o) => !savingCustomer && setEditCustomerOpen(o)}>
        <DialogContent showCloseButton={false} className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Müşteriyi Düzenle</DialogTitle>
            <DialogDescription>Müşteri bilgilerini güncelleyin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ad <span className="text-destructive">*</span></Label>
                <Input value={customerForm.firstName} onChange={(e) => setCustomerForm(p => ({ ...p, firstName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Soyad <span className="text-destructive">*</span></Label>
                <Input value={customerForm.lastName} onChange={(e) => setCustomerForm(p => ({ ...p, lastName: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>E-posta</Label>
              <Input type="email" value={customerForm.email} onChange={(e) => setCustomerForm(p => ({ ...p, email: e.target.value }))} placeholder="ornek@email.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Telefon</Label>
              <Input
                value={customerForm.phone}
                onChange={(e) => { setPhoneError(false); setCustomerForm(p => ({ ...p, phone: formatPhone(e.target.value) })) }}
                placeholder="0532 123 3212"
                inputMode="numeric"
                className={cn(phoneError && "border-destructive")}
              />
              {phoneError && <p className="text-xs text-destructive">11 haneli olmalıdır</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Şirket</Label>
                <Input value={customerForm.company} onChange={(e) => setCustomerForm(p => ({ ...p, company: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Şehir</Label>
                <Input value={customerForm.city} onChange={(e) => setCustomerForm(p => ({ ...p, city: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Durum</Label>
              <Select value={customerForm.status} onValueChange={(v) => setCustomerForm(p => ({ ...p, status: v as Status }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="lead">Aday</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notlar</Label>
              <Textarea value={customerForm.notes} onChange={(e) => setCustomerForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCustomerOpen(false)} disabled={savingCustomer}>İptal</Button>
            <Button onClick={handleSaveCustomer} disabled={savingCustomer} className="min-w-24">
              {savingCustomer ? <Loader2 className="size-4 animate-spin" /> : "Güncelle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Müşteri Sil ─────────────────────────────────────────────── */}
      <AlertDialog open={deleteCustomerOpen} onOpenChange={(o) => !o && !deletingCustomer && setDeleteCustomerOpen(o)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Müşteri silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{customer.firstName} {customer.lastName}</strong> ve bu müşteriye ait tüm süreç ve aktiviteler kalıcı olarak silinecek.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingCustomer}>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} disabled={deletingCustomer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletingCustomer ? <Loader2 className="size-4 animate-spin" /> : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Aktivite Ekle/Düzenle ───────────────────────────────────── */}
      <Dialog open={activityDialogOpen} onOpenChange={(o) => !savingActivity && setActivityDialogOpen(o)}>
        <DialogContent showCloseButton={false} className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingActivityId ? "Aktiviteyi Düzenle" : "Yeni Aktivite"}</DialogTitle>
            <DialogDescription>
              {editingActivityId ? "Aktivite bilgilerini güncelleyin." : "Müşteri ile etkileşimi kaydedin."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tür <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-5 gap-2">
                {(Object.entries(TYPE_CONFIG) as [ActivityType, typeof TYPE_CONFIG[ActivityType]][]).map(([value, cfg]) => {
                  const Icon = cfg.icon
                  const selected = activityForm.type === value
                  return (
                    <button key={value} type="button"
                      onClick={() => setActivityForm(p => ({ ...p, type: value }))}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border py-2 px-1.5 text-xs font-medium transition-all",
                        selected ? cn(cfg.className, "ring-2 ring-offset-1 ring-current") : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <div className={cn("size-5 rounded-full flex items-center justify-center border", selected ? cfg.className : "bg-muted border-border")}>
                        <Icon className="size-3" />
                      </div>
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tarih ve Saat <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-3 gap-2">
                <Input type="date" value={activityForm.date} onChange={(e) => setActivityForm(p => ({ ...p, date: e.target.value }))} />
                <Select value={activityForm.hour} onValueChange={(v) => setActivityForm(p => ({ ...p, hour: v }))}>
                  <SelectTrigger><SelectValue placeholder="Saat" /></SelectTrigger>
                  <SelectContent className="max-h-52">{HOURS.map(h => <SelectItem key={h} value={h}>{h}:00</SelectItem>)}</SelectContent>
                </Select>
                <Select value={activityForm.minute} onValueChange={(v) => setActivityForm(p => ({ ...p, minute: v }))}>
                  <SelectTrigger><SelectValue placeholder="Dakika" /></SelectTrigger>
                  <SelectContent className="max-h-52">{MINUTES.map(m => <SelectItem key={m} value={m}>:{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Başlık <span className="text-destructive">*</span></Label>
              <Input value={activityForm.title} onChange={(e) => setActivityForm(p => ({ ...p, title: e.target.value }))} placeholder="Örn: İlk görüşme yapıldı" />
            </div>
            <div className="space-y-1.5">
              <Label>Açıklama</Label>
              <Textarea value={activityForm.description} onChange={(e) => setActivityForm(p => ({ ...p, description: e.target.value }))} rows={3} className="resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityDialogOpen(false)} disabled={savingActivity}>İptal</Button>
            <Button onClick={handleSaveActivity} disabled={savingActivity} className="min-w-24">
              {savingActivity ? <Loader2 className="size-4 animate-spin" /> : editingActivityId ? "Güncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Aktivite Sil ─────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteActivityId} onOpenChange={(o) => !o && !deletingActivity && setDeleteActivityId(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Aktivite silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>Bu işlem geri alınamaz.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingActivity}>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteActivity} disabled={deletingActivity} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletingActivity ? <Loader2 className="size-4 animate-spin" /> : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Süreç Ekle/Düzenle ──────────────────────────────────────── */}
      <Dialog open={processDialogOpen} onOpenChange={(o) => !savingProcess && setProcessDialogOpen(o)}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProcessId ? "Süreci Düzenle" : "Yeni Süreç"}</DialogTitle>
            <DialogDescription>
              {editingProcessId ? "Süreç bilgilerini güncelleyin." : "Müşteri için yeni süreç başlatın."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Başlık <span className="text-destructive">*</span></Label>
              <Input value={processForm.title} onChange={(e) => setProcessForm(p => ({ ...p, title: e.target.value }))} placeholder="Süreç başlığı" />
            </div>
            <div className="space-y-1.5">
              <Label>Açıklama</Label>
              <Textarea value={processForm.description} onChange={(e) => setProcessForm(p => ({ ...p, description: e.target.value }))} rows={3} className="resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label>Aşama</Label>
              <Select value={processForm.stage} onValueChange={(v) => setProcessForm(p => ({ ...p, stage: v as Stage }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGE_ORDER.map(s => (
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessDialogOpen(false)} disabled={savingProcess}>İptal</Button>
            <Button onClick={handleSaveProcess} disabled={savingProcess} className="min-w-24">
              {savingProcess ? <Loader2 className="size-4 animate-spin" /> : editingProcessId ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Süreç Sil ────────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteProcessId} onOpenChange={(o) => !o && !deletingProcess && setDeleteProcessId(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Süreç silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>Bu işlem geri alınamaz.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingProcess}>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProcess} disabled={deletingProcess} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletingProcess ? <Loader2 className="size-4 animate-spin" /> : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
