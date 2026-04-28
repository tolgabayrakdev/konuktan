import { Users, FolderOpen, CheckCircle2, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

const stats = [
  {
    label: "Toplam Kullanıcı",
    value: "1,234",
    change: "+12%",
    icon: Users,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    label: "Aktif Projeler",
    value: "42",
    change: "+3",
    icon: FolderOpen,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    label: "Tamamlanan Görevler",
    value: "856",
    change: "+48",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
]

export default function AppIndex() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Platforma genel bakış</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, change, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card rounded-xl border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <div className={cn("size-9 rounded-lg flex items-center justify-center", bg)}>
                <Icon className={cn("size-4", color)} />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-semibold tracking-tight">{value}</p>
              <span className="text-xs text-emerald-500 font-medium mb-1 flex items-center gap-0.5">
                <TrendingUp className="size-3" />
                {change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-base font-medium mb-4">Son Aktiviteler</h2>
          <div className="space-y-3">
            {["Yeni kullanıcı kaydoldu", "Proje güncellendi", "Görev tamamlandı", "Yorum eklendi"].map(
              (item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="size-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                  <span className="ml-auto text-xs text-muted-foreground/60">{i + 1}s önce</span>
                </div>
              )
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-base font-medium mb-4">Hızlı İstatistikler</h2>
          <div className="space-y-3">
            {[
              { label: "Tamamlanma oranı", value: 69, color: "bg-emerald-500" },
              { label: "Aktif kullanıcı oranı", value: 82, color: "bg-blue-500" },
              { label: "Görev ilerleme", value: 54, color: "bg-violet-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", color)}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
