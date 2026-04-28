import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { useAuthStore } from "@/store/auth-store"
import { apiClient, ApiClientError } from "@/lib/api-client"
import { AuthLeftPanel } from "@/components/auth-left-panel"
import wernaLogo from "@/assets/werna_logo.svg"

const RESEND_COOLDOWN = 90

export default function SignIn() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState(() => localStorage.getItem("remembered_email") ?? "")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem("remembered_email"))

  const [step, setStep] = useState<"login" | "verify">("login")
  const [code, setCode] = useState("")
  const [countdown, setCountdown] = useState(0)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const sendVerificationCode = async () => {
    setResending(true)
    try {
      await apiClient.post("/api/auth/resend-verification", { email })
      setCountdown(RESEND_COOLDOWN)
    } catch (error) {
      const message = error instanceof ApiClientError ? error.data.message : "Kod gönderilemedi"
      toast.error(message || "Kod gönderilemedi")
    } finally {
      setResending(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      if (rememberMe) {
        localStorage.setItem("remembered_email", email)
      } else {
        localStorage.removeItem("remembered_email")
      }
      toast.success("Giriş başarılı")
      navigate("/", { replace: true })
    } catch (error) {
      if (
        error instanceof ApiClientError &&
        error.data.message === "Please verify your email first"
      ) {
        setCountdown(RESEND_COOLDOWN)
        setStep("verify")
        return
      }
      const message = error instanceof ApiClientError ? error.data.message : "Giriş yapılamadı"
      toast.error(message || "Giriş yapılamadı")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await apiClient.post("/api/auth/verify", { email, code })
      toast.success("E-posta doğrulandı!")
      await login(email, password)
      navigate("/", { replace: true })
    } catch (error) {
      const message = error instanceof ApiClientError ? error.data.message : "Doğrulama başarısız"
      toast.error(message || "Doğrulama başarısız")
    } finally {
      setLoading(false)
    }
  }

  if (step === "verify") {
    return (
      <div className="min-h-screen grid lg:grid-cols-2">
        <AuthLeftPanel
          heading={<>Hesabınızı<br />doğrulayın</>}
          description="E-posta adresinize gönderilen 6 haneli kodu girerek kimliğinizi doğrulayın."
        />

        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            <div className="lg:hidden text-center">
              <div className="flex items-center justify-center gap-2">
                <img src={wernaLogo} alt="Werna" className="h-8 w-auto" />
                <span className="text-2xl font-semibold tracking-tight">Werna</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">E-posta doğrulama</p>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">Doğrulama Kodu</h2>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{email}</span> adresine kod gönderildi
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">6 Haneli Kod</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  className="h-11 text-center text-lg tracking-[0.4em]"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  autoFocus
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11"
                disabled={loading || code.length < 6}
              >
                {loading ? "Doğrulanıyor..." : "Doğrula"}
              </Button>
            </form>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={sendVerificationCode}
                disabled={countdown > 0 || resending}
                className="text-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline transition-opacity"
              >
                {resending ? "Gönderiliyor..." : "Kodu yeniden gönder"}
              </button>
              {countdown > 0 && (
                <span className="text-muted-foreground tabular-nums">
                  {countdown}s
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => { setStep("login"); setCode("") }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Farklı hesapla giriş yap
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <AuthLeftPanel
        heading={<>İşinizi dijital<br />dünyaya taşıyın</>}
        description="Modern ve güvenli platformumuz ile iş süreçlerinizi optimize edin, verimliliğinizi artırın."
      />

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Werna</h1>
            <p className="text-sm text-muted-foreground mt-1">Hoş geldiniz</p>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Giriş yapın</h2>
            <p className="text-sm text-muted-foreground">Hesabınıza erişmek için bilgilerinizi girin</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                className="h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Şifre</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Şifremi unuttum
                </Link>
              </div>
              <PasswordInput
                id="password"
                className="h-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                Beni hatırla
              </Label>
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">veya</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-11" disabled>
              <svg className="size-5 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </Button>
            <Button variant="outline" className="h-11" disabled>
              <svg className="size-5 mr-2" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" fill="#333" />
              </svg>
              GitHub
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Hesabınız yok mu?{" "}
            <Link to="/sign-up" className="text-primary font-medium hover:underline">
              Kayıt olun
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
