import { useState, useEffect } from "react"
import { Link } from "react-router"
import { useAuthStore } from "@/store/auth-store"
import { apiClient } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import {
  Users, Activity, ArrowRight,
  Phone, Mail, FileText, HandshakeIcon,
  Loader2, TrendingUp, UserCheck, KanbanSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Stats {
  totalCustomers: number
  activeCustomers: number
  leadCustomers: number
  inProgressProcesses: number
  doneProcesses: number
  weeklyActivities: number
}

interface RecentActivity {
  id: string
  customerName: string
  type: "call" | "email" | "meeting" | "note" | "offer"
  title: string
  happenedAt: string
}

interface ProcessStage {
  todo: number
  in_progress: number
  done: number
  failed: number
}

const ACTIVITY_ICON: Record<RecentActivity["type"], React.ElementType> = {
  call: Phone,
  email: Mail,
  meeting: HandshakeIcon,
  note: FileText,
  offer: FileText,
}

const ACTIVITY_LABEL: Record<RecentActivity["type"], string> = {
  call: "Arama",
  email: "E-posta",
  meeting: "Toplantı",
  note: "Not",
  offer: "Teklif",
}

const ACTIVITY_CLASS: Record<RecentActivity["type"], string> = {
  call:    "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800",
  email:   "bg-violet-500/10 text-violet-600 border-violet-200 dark:border-violet-800",
  meeting: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800",
  note:    "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800",
  offer:   "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800",
}

const STAGE_COLORS = {
  in_progress: "#3b82f6",
  done:        "#10b981",
  todo:        "#94a3b8",
  failed:      "#ef4444",
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Günaydın"
  if (h < 18) return "İyi günler"
  return "İyi akşamlar"
}

function todayLabel() {
  return new Date().toLocaleDateString("tr-TR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })
}

function startOfWeek() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// ── Donut Chart ─────────────────────────────────────────────────────────────

interface DonutSegment {
  value: number
  color: string
  label: string
}

function DonutChart({ segments, total }: { segments: DonutSegment[]; total: number }) {
  const cx = 60, cy = 60, r = 42, sw = 14
  const circumference = 2 * Math.PI * r

  if (total === 0) {
    return (
      <svg viewBox="0 0 120 120" className="w-full">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor"
          strokeWidth={sw} className="text-muted" />
        <text x={cx} y={cy + 5} textAnchor="middle" className="fill-muted-foreground"
          style={{ fontSize: 11, fontWeight: 500 }}>Veri yok</text>
      </svg>
    )
  }

  let cumulative = 0
  return (
    <svg viewBox="0 0 120 120" className="w-full">
      {/* Background circle */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor"
        strokeWidth={sw} className="text-muted/40" />
      {segments.map((seg, i) => {
        const fraction = seg.value / total
        const startAngle = cumulative
        cumulative += fraction
        if (seg.value === 0) return null
        return (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={sw}
            strokeDasharray={`${fraction * circumference} ${circumference}`}
            strokeDashoffset={0}
            style={{
              transform: `rotate(${-90 + startAngle * 360}deg)`,
              transformOrigin: `${cx}px ${cy}px`,
            }}
          />
        )
      })}
      {/* Center label */}
      <text x={cx} y={cy - 5} textAnchor="middle" fill="currentColor"
        style={{ fontSize: 22, fontWeight: 700 }}>{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="currentColor"
        style={{ fontSize: 9, opacity: 0.5 }}>SÜREÇ</text>
    </svg>
  )
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, iconClass, iconBg, loading,
}: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; iconClass: string; iconBg: string; loading: boolean
}) {
  return (
    <div className="bg-card rounded-xl border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <div className={cn("size-9 rounded-lg flex items-center justify-center", iconBg)}>
          <Icon className={cn("size-4", iconClass)} />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-16 rounded bg-muted animate-pulse" />
      ) : (
        <div className="flex items-end gap-2">
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {sub && <span className="text-xs text-muted-foreground mb-1">{sub}</span>}
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AppIndex() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [stages, setStages] = useState<ProcessStage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const weekStart = startOfWeek().toISOString()
        const weekEnd = new Date(new Date().setHours(23, 59, 59, 999)).toISOString()

        const [allCust, activeCust, leadCust, procRes, actWeek, actRecent] = await Promise.all([
          apiClient.get<{ pagination: { total: number } }>("/api/customers?limit=1"),
          apiClient.get<{ pagination: { total: number } }>("/api/customers?status=active&limit=1"),
          apiClient.get<{ pagination: { total: number } }>("/api/customers?status=lead&limit=1"),
          apiClient.get<{ data: { stage: string }[] }>("/api/processes"),
          apiClient.get<{ pagination: { total: number } }>(`/api/activities?limit=1&startDate=${weekStart}&endDate=${weekEnd}`),
          apiClient.get<{ data: RecentActivity[] }>("/api/activities?limit=6"),
        ])

        if (cancelled) return

        const stageCount: ProcessStage = { todo: 0, in_progress: 0, done: 0, failed: 0 }
        for (const p of procRes.data) {
          if (p.stage in stageCount) stageCount[p.stage as keyof ProcessStage]++
        }

        setStats({
          totalCustomers: allCust.pagination.total,
          activeCustomers: activeCust.pagination.total,
          leadCustomers: leadCust.pagination.total,
          inProgressProcesses: stageCount.in_progress,
          doneProcesses: stageCount.done,
          weeklyActivities: actWeek.pagination.total,
        })
        setStages(stageCount)
        setActivities(actRecent.data)
      } catch {
        // silent fail
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const totalProcesses = stages ? Object.values(stages).reduce((a, b) => a + b, 0) : 0

  const donutSegments: DonutSegment[] = [
    { value: stages?.in_progress ?? 0, color: STAGE_COLORS.in_progress, label: "Devam Ediyor" },
    { value: stages?.done ?? 0,        color: STAGE_COLORS.done,        label: "Tamamlandı" },
    { value: stages?.todo ?? 0,        color: STAGE_COLORS.todo,        label: "Başlanmadı" },
    { value: stages?.failed ?? 0,      color: STAGE_COLORS.failed,      label: "Başarısız" },
  ]

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground font-medium capitalize">{todayLabel()}</p>
        <h1 className="text-2xl font-bold tracking-tight mt-0.5">
          {getGreeting()}{user?.email ? `, ${user.email.split("@")[0]}` : ""} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Platforma genel bakış.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Toplam Müşteri"
          value={stats?.totalCustomers ?? 0}
          sub={stats ? `${stats.leadCustomers} aday` : undefined}
          icon={Users}
          iconClass="text-blue-500"
          iconBg="bg-blue-500/10"
          loading={loading}
        />
        <StatCard
          label="Aktif Müşteri"
          value={stats?.activeCustomers ?? 0}
          sub={stats && stats.totalCustomers > 0
            ? `%${Math.round((stats.activeCustomers / stats.totalCustomers) * 100)} oran`
            : undefined}
          icon={UserCheck}
          iconClass="text-emerald-500"
          iconBg="bg-emerald-500/10"
          loading={loading}
        />
        <StatCard
          label="Devam Eden Süreç"
          value={stats?.inProgressProcesses ?? 0}
          sub={stats ? `${stats.doneProcesses} tamamlandı` : undefined}
          icon={KanbanSquare}
          iconClass="text-violet-500"
          iconBg="bg-violet-500/10"
          loading={loading}
        />
        <StatCard
          label="Bu Haftaki Aktivite"
          value={stats?.weeklyActivities ?? 0}
          icon={TrendingUp}
          iconClass="text-amber-500"
          iconBg="bg-amber-500/10"
          loading={loading}
        />
      </div>

      {/* Middle row */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent activities */}
        <div className="lg:col-span-3 bg-card rounded-xl border flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-sm">Son Aktiviteler</h2>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-xs h-7 text-muted-foreground hover:text-foreground">
              <Link to="/customers">
                Müşterilere git
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </div>
          <div className="flex-1 divide-y">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <Activity className="size-8 opacity-20" />
                <p className="text-sm">Henüz aktivite yok</p>
              </div>
            ) : (
              activities.map((a) => {
                const Icon = ACTIVITY_ICON[a.type]
                const cls = ACTIVITY_CLASS[a.type]
                return (
                  <div key={a.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                    <div className={cn("size-8 rounded-full border flex items-center justify-center shrink-0", cls)}>
                      <Icon className="size-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.customerName}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge variant="outline" className={cn("text-xs mb-1", cls)}>
                        {ACTIVITY_LABEL[a.type]}
                      </Badge>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {new Date(a.happenedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Process donut chart */}
        <div className="lg:col-span-2 bg-card rounded-xl border">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-sm">Süreç Dağılımı</h2>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-xs h-7 text-muted-foreground hover:text-foreground">
              <Link to="/processes">
                Tümünü gör
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </div>
          <div className="px-5 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <div className="w-32 shrink-0">
                  <DonutChart segments={donutSegments} total={totalProcesses} />
                </div>
                <div className="flex-1 space-y-2.5">
                  {donutSegments.map((seg) => (
                    <div key={seg.label} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: seg.color }}
                        />
                        <span className="text-xs text-muted-foreground truncate">{seg.label}</span>
                      </div>
                      <span className="text-xs font-semibold tabular-nums shrink-0">{seg.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer breakdown bar */}
      {!loading && stats && stats.totalCustomers > 0 && (
        <div className="bg-card rounded-xl border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Müşteri Dağılımı</h2>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-xs h-7 text-muted-foreground hover:text-foreground">
              <Link to="/customers">
                Müşterilere git
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            {stats.activeCustomers > 0 && (
              <div
                className="bg-emerald-500 rounded-l-full"
                style={{ width: `${(stats.activeCustomers / stats.totalCustomers) * 100}%` }}
                title={`Aktif: ${stats.activeCustomers}`}
              />
            )}
            {stats.leadCustomers > 0 && (
              <div
                className="bg-amber-400"
                style={{ width: `${(stats.leadCustomers / stats.totalCustomers) * 100}%` }}
                title={`Aday: ${stats.leadCustomers}`}
              />
            )}
            {(stats.totalCustomers - stats.activeCustomers - stats.leadCustomers) > 0 && (
              <div
                className="bg-muted rounded-r-full flex-1"
                title={`Pasif: ${stats.totalCustomers - stats.activeCustomers - stats.leadCustomers}`}
              />
            )}
          </div>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 inline-block" />
              Aktif — {stats.activeCustomers}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-400 inline-block" />
              Aday — {stats.leadCustomers}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-muted-foreground/40 inline-block" />
              Pasif — {stats.totalCustomers - stats.activeCustomers - stats.leadCustomers}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
