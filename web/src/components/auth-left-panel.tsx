import { Shield, Zap, BarChart3 } from "lucide-react"
import konuktanLogo from "@/assets/konuktan_logo.svg"

const features = [
  {
    icon: Shield,
    title: "Güvenli Altyapı",
    desc: "Verileriniz uçtan uca şifrelenmiş ve güvende",
  },
  {
    icon: Zap,
    title: "Hızlı ve Güvenilir",
    desc: "Kesintisiz hizmet, anında erişim",
  },
  {
    icon: BarChart3,
    title: "Güçlü Analitik",
    desc: "İş süreçlerinizi veriye dayalı optimize edin",
  },
]

interface AuthLeftPanelProps {
  heading: React.ReactNode
  description: string
}

export function AuthLeftPanel({ heading, description }: AuthLeftPanelProps) {
  return (
    <div className="hidden lg:flex flex-col relative overflow-hidden bg-slate-950 p-12 text-white select-none">
      {/* Decorative blobs */}
      <div className="absolute -top-40 -right-40 size-[520px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 size-[420px] rounded-full bg-indigo-600/15 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 size-[200px] rounded-full bg-violet-500/10 blur-[60px] pointer-events-none" />

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <img src={konuktanLogo} alt="konuktan" className="h-9 w-auto brightness-0 invert" />
          <span className="text-xl font-semibold tracking-tight">Konuktan</span>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col justify-center space-y-10">
          <div className="space-y-4">
            <h2 className="text-[2.6rem] font-bold leading-[1.15] tracking-tight">
              {heading}
            </h2>
            <p className="text-white/55 text-base leading-relaxed max-w-[300px]">
              {description}
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3.5">
                <div className="size-9 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 backdrop-blur-sm">
                  <Icon className="size-4 text-white/70" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none mb-1">{title}</p>
                  <p className="text-white/45 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-white/25">© 2026 konuktan. Tüm hakları saklıdır.</p>
      </div>
    </div>
  )
}
