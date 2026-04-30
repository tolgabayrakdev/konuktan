import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, Download, FileText, Pencil, Trash2, Users, ChevronDown, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiClient, ApiClientError } from "@/lib/api-client"
import { useNavigate } from "react-router"

type Status = "active" | "inactive" | "lead"

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  company: string | null
  city: string | null
  status: Status
  notes: string | null
  createdAt: string
  updatedAt: string
}

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  active: { label: "Aktif", className: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800" },
  inactive: { label: "Pasif", className: "bg-muted text-muted-foreground border-border" },
  lead: { label: "Aday", className: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800" },
}

const FILTER_TABS: { value: "all" | Status; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "active", label: "Aktif" },
  { value: "lead", label: "Aday" },
  { value: "inactive", label: "Pasif" },
]

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  city: "",
  status: "lead" as Status,
  notes: "",
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 4) return digits
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
}

function exportCSV(customers: Customer[]) {
  const headers = ["Ad", "Soyad", "E-posta", "Telefon", "Şirket", "Şehir", "Durum", "Kayıt Tarihi"]
  const rows = customers.map((c) => [
    c.firstName, c.lastName, c.email ?? "", c.phone ?? "", c.company ?? "", c.city ?? "",
    STATUS_CONFIG[c.status].label, c.createdAt.slice(0, 10),
  ])
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n")
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `musteriler_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportPDF(customers: Customer[]) {
  const date = new Date().toLocaleDateString("tr-TR")
  const rows = customers.map((c) => `
    <tr>
      <td>${c.firstName} ${c.lastName}</td>
      <td>${c.company || "—"}</td>
      <td>${c.email || "—"}</td>
      <td>${c.phone || "—"}</td>
      <td>${c.city || "—"}</td>
      <td class="status status-${c.status}">${STATUS_CONFIG[c.status].label}</td>
      <td>${c.createdAt.slice(0, 10)}</td>
    </tr>`).join("")

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>Müşteri Listesi</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 11px; color: #111; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; border-bottom: 2px solid #111; padding-bottom: 12px; }
    .header h1 { font-size: 20px; font-weight: 700; }
    .header span { font-size: 10px; color: #666; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f4f4f5; }
    th { text-align: left; padding: 8px 10px; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #555; border-bottom: 1px solid #e4e4e7; }
    td { padding: 7px 10px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    .status { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 600; }
    .status-active { background: #d1fae5; color: #065f46; }
    .status-inactive { background: #f4f4f5; color: #71717a; }
    .status-lead { background: #fef3c7; color: #92400e; }
    .footer { margin-top: 20px; font-size: 9px; color: #aaa; text-align: right; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div><h1>Müşteri Listesi</h1><span>${customers.length} kayıt</span></div>
    <span>${date}</span>
  </div>
  <table>
    <thead><tr><th>Ad Soyad</th><th>Şirket</th><th>E-posta</th><th>Telefon</th><th>Şehir</th><th>Durum</th><th>Kayıt Tarihi</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">Konuktan CRM · ${date}</div>
</body>
</html>`

  const win = window.open("", "_blank")
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}

export default function Customers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all")

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [phoneError, setPhoneError] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const PAGE_SIZE = 20
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
        if (debouncedSearch) params.set("search", debouncedSearch)
        if (statusFilter !== "all") params.set("status", statusFilter)
        const res = await apiClient.get<{ success: boolean; data: Customer[]; pagination: { total: number; totalPages: number } }>(`/api/customers?${params}`)
        if (!cancelled) { setCustomers(res.data); setTotal(res.pagination.total) }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof ApiClientError ? err.data.message : undefined
          toast.error(msg ?? "Müşteriler yüklenemedi")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [debouncedSearch, statusFilter, page])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter])

  const filtered = customers
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setPhoneError(false)
    setSheetOpen(true)
  }

  const openEdit = (c: Customer) => {
    setEditingId(c.id)
    setForm({
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email ?? "",
      phone: c.phone ?? "",
      company: c.company ?? "",
      city: c.city ?? "",
      status: c.status,
      notes: c.notes ?? "",
    })
    setPhoneError(false)
    setSheetOpen(true)
  }

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("Ad ve soyad zorunludur")
      return
    }
    if (form.phone) {
      const digits = form.phone.replace(/\D/g, "")
      if (digits.length !== 11) {
        setPhoneError(true)
        toast.error("Telefon numarası 11 haneli olmalıdır (örn: 0532 123 3212)")
        return
      }
    }
    setPhoneError(false)
    setSaving(true)
    try {
      if (editingId) {
        const res = await apiClient.patch<{ success: boolean; data: Customer }>(`/api/customers/${editingId}`, form)
        setCustomers((prev) => prev.map((c) => c.id === editingId ? res.data : c))
        toast.success("Müşteri güncellendi")
      } else {
        const res = await apiClient.post<{ success: boolean; data: Customer }>("/api/customers", form)
        setCustomers((prev) => [res.data, ...prev])
        setTotal(t => t + 1)
        toast.success("Müşteri eklendi")
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
      await apiClient.delete(`/api/customers/${deleteId}`)
      setCustomers((prev) => prev.filter((c) => c.id !== deleteId))
      setTotal(t => t - 1)
      toast.success("Müşteri silindi")
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
          <h1 className="text-2xl font-semibold tracking-tight">Müşteriler</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Yükleniyor..." : `${total} müşteri kayıtlı`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5" disabled={loading || total === 0}>
                <Download className="size-4" />
                Dışa Aktar
                <ChevronDown className="size-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportCSV(filtered)}>
                <Download className="size-4 mr-2" />
                CSV olarak indir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportPDF(filtered)}>
                <FileText className="size-4 mr-2" />
                PDF olarak kaydet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={openAdd} className="gap-1.5">
            <Plus className="size-4" />
            Müşteri Ekle
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {FILTER_TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={cn(
                "px-3 py-1 text-sm rounded-md font-medium transition-colors",
                statusFilter === value
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ad Soyad</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Şirket</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">E-posta</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Telefon</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Şehir</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durum</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-muted-foreground">
                    <Loader2 className="size-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="size-8 opacity-30" />
                      <p>{search ? "Arama sonucu bulunamadı" : "Henüz müşteri yok"}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/customers/${c.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-muted-foreground md:hidden">{c.company || "—"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.company || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{c.email || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{c.phone || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">{c.city || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn("text-xs font-medium", STATUS_CONFIG[c.status].className)}>
                        {STATUS_CONFIG[c.status].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(c)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(c.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t bg-muted/20 flex items-center justify-between">
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p} variant={p === page ? "default" : "outline"}
                  size="sm" className="h-7 w-7 p-0"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
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
      </div>

      {/* Sheet — Ekle / Düzenle */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle>{editingId ? "Müşteriyi Düzenle" : "Yeni Müşteri"}</SheetTitle>
            <SheetDescription>
              {editingId ? "Müşteri bilgilerini güncelleyin." : "Yeni bir müşteri ekleyin."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ad <span className="text-destructive">*</span></Label>
                <Input value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} placeholder="Ad" />
              </div>
              <div className="space-y-1.5">
                <Label>Soyad <span className="text-destructive">*</span></Label>
                <Input value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} placeholder="Soyad" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>E-posta</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="ornek@email.com" />
            </div>

            <div className="space-y-1.5">
              <Label>Telefon</Label>
              <Input
                value={form.phone}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value)
                  setPhoneError(false)
                  setForm((p) => ({ ...p, phone: formatted }))
                }}
                placeholder="0532 123 3212"
                className={cn(phoneError && "border-destructive focus-visible:ring-destructive")}
                inputMode="numeric"
              />
              {phoneError && (
                <p className="text-xs text-destructive">11 haneli olmalıdır (örn: 0532 123 3212)</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Şirket</Label>
              <Input value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} placeholder="Şirket adı" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Şehir</Label>
                <Input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder="Şehir" />
              </div>
              <div className="space-y-1.5">
                <Label>Durum</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as Status }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="lead">Aday</SelectItem>
                    <SelectItem value="inactive">Pasif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notlar</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Müşteri hakkında notlar..."
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          <SheetFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => setSheetOpen(false)} disabled={saving}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-24">
              {saving ? <Loader2 className="size-4 animate-spin" /> : editingId ? "Güncelle" : "Ekle"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Silme onayı */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && !deleting && setDeleteId(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Müşteri silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Müşteriye ait tüm veriler kalıcı olarak silinecek.
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
