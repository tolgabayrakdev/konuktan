import { useState, useMemo } from "react"
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
import { Plus, Search, Download, Pencil, Trash2, Users } from "lucide-react"
import { cn } from "@/lib/utils"

type Status = "active" | "inactive" | "lead"

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  city: string
  status: Status
  notes: string
  createdAt: string
}

const MOCK_CUSTOMERS: Customer[] = [
  { id: "1", firstName: "Ahmet", lastName: "Yılmaz", email: "ahmet@yilmaz.com", phone: "0532 111 2233", company: "Yılmaz Yapı", city: "İstanbul", status: "active", notes: "VIP müşteri", createdAt: "2025-01-10" },
  { id: "2", firstName: "Fatma", lastName: "Kaya", email: "fatma@kayatekstil.com", phone: "0533 222 3344", company: "Kaya Tekstil", city: "Bursa", status: "active", notes: "", createdAt: "2025-01-15" },
  { id: "3", firstName: "Mehmet", lastName: "Demir", email: "mehmet.demir@gmail.com", phone: "0541 333 4455", company: "", city: "Ankara", status: "lead", notes: "Fiyat teklifi bekleniyor", createdAt: "2025-02-03" },
  { id: "4", firstName: "Ayşe", lastName: "Çelik", email: "ayse@celikholding.com", phone: "0542 444 5566", company: "Çelik Holding", city: "İzmir", status: "active", notes: "", createdAt: "2025-02-11" },
  { id: "5", firstName: "Mustafa", lastName: "Şahin", email: "mustafa@sahinlojistik.com", phone: "0543 555 6677", company: "Şahin Lojistik", city: "Konya", status: "inactive", notes: "Sözleşme yenilenmedi", createdAt: "2025-02-20" },
  { id: "6", firstName: "Zeynep", lastName: "Arslan", email: "zeynep.arslan@outlook.com", phone: "0544 666 7788", company: "Arslan Gıda", city: "Adana", status: "lead", notes: "Demo gösterimi yapıldı", createdAt: "2025-03-01" },
  { id: "7", firstName: "Hasan", lastName: "Koç", email: "hasan@kocinsaat.com.tr", phone: "0545 777 8899", company: "Koç İnşaat", city: "İstanbul", status: "active", notes: "", createdAt: "2025-03-07" },
  { id: "8", firstName: "Elif", lastName: "Aydın", email: "elif.aydin@gmail.com", phone: "0546 888 9900", company: "", city: "Antalya", status: "inactive", notes: "", createdAt: "2025-03-14" },
  { id: "9", firstName: "İbrahim", lastName: "Öztürk", email: "ibrahim@ozturkmarket.com", phone: "0547 999 0011", company: "Öztürk Market", city: "Samsun", status: "active", notes: "Aylık fatura", createdAt: "2025-03-21" },
  { id: "10", firstName: "Merve", lastName: "Yıldız", email: "merve.yildiz@hotmail.com", phone: "0548 000 1122", company: "Yıldız Mühendislik", city: "Gaziantep", status: "lead", notes: "", createdAt: "2025-04-02" },
  { id: "11", firstName: "Emre", lastName: "Güneş", email: "emre@gunesoto.com", phone: "0549 111 2233", company: "Güneş Otomotiv", city: "Kayseri", status: "active", notes: "", createdAt: "2025-04-09" },
  { id: "12", firstName: "Selin", lastName: "Aktaş", email: "selin.aktas@aktas.com.tr", phone: "0550 222 3344", company: "Aktaş Tarım", city: "Konya", status: "active", notes: "Sezonluk görüşme", createdAt: "2025-04-15" },
]

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

const EMPTY_FORM: Omit<Customer, "id" | "createdAt"> = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  city: "",
  status: "lead",
  notes: "",
}

function exportCSV(customers: Customer[]) {
  const headers = ["Ad", "Soyad", "E-posta", "Telefon", "Şirket", "Şehir", "Durum", "Kayıt Tarihi"]
  const rows = customers.map((c) => [
    c.firstName,
    c.lastName,
    c.email,
    c.phone,
    c.company,
    c.city,
    STATUS_CONFIG[c.status].label,
    c.createdAt,
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

export default function Musteriler() {
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all")

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return customers.filter((c) => {
      const matchStatus = statusFilter === "all" || c.status === statusFilter
      const matchSearch =
        !q ||
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.phone.includes(q)
      return matchStatus && matchSearch
    })
  }, [customers, search, statusFilter])

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  const openEdit = (c: Customer) => {
    setEditingId(c.id)
    setForm({ firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone, company: c.company, city: c.city, status: c.status, notes: c.notes })
    setSheetOpen(true)
  }

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("Ad ve soyad zorunludur")
      return
    }
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))
    if (editingId) {
      setCustomers((prev) => prev.map((c) => c.id === editingId ? { ...c, ...form } : c))
      toast.success("Müşteri güncellendi")
    } else {
      const newCustomer: Customer = {
        ...form,
        id: Date.now().toString(),
        createdAt: new Date().toISOString().slice(0, 10),
      }
      setCustomers((prev) => [newCustomer, ...prev])
      toast.success("Müşteri eklendi")
    }
    setSaving(false)
    setSheetOpen(false)
  }

  const handleDelete = () => {
    if (!deleteId) return
    setCustomers((prev) => prev.filter((c) => c.id !== deleteId))
    toast.success("Müşteri silindi")
    setDeleteId(null)
  }

  const counts = useMemo(() => ({
    all: customers.length,
    active: customers.filter((c) => c.status === "active").length,
    lead: customers.filter((c) => c.status === "lead").length,
    inactive: customers.filter((c) => c.status === "inactive").length,
  }), [customers])

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Müşteriler</h1>
          <p className="text-sm text-muted-foreground mt-1">{customers.length} müşteri kayıtlı</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCSV(filtered)} className="gap-1.5">
            <Download className="size-4" />
            Dışa Aktar
          </Button>
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
              <span className={cn("ml-1.5 text-xs", statusFilter === value ? "text-muted-foreground" : "text-muted-foreground/60")}>
                {counts[value]}
              </span>
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="size-8 opacity-30" />
                      <p>Müşteri bulunamadı</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-muted-foreground md:hidden">{c.company || "—"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.company || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{c.email}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{c.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">{c.city}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn("text-xs font-medium", STATUS_CONFIG[c.status].className)}>
                        {STATUS_CONFIG[c.status].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(c)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(c.id)}>
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

        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
            {filtered.length} sonuç gösteriliyor{filtered.length !== customers.length && ` (toplam ${customers.length})`}
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
              <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="0500 000 0000" />
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
              {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Ekle"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Silme onayı */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Müşteri silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Müşteriye ait tüm veriler kalıcı olarak silinecek.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
