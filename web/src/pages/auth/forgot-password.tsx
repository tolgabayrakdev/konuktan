import { useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { apiClient, ApiClientError } from "@/lib/api-client"
import { AuthLeftPanel } from "@/components/auth-left-panel"
import wernaLogo from "@/assets/werna_logo.svg"

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await apiClient.post("/api/auth/forgot-password", { email })
      setSent(true)
    } catch (error) {
      const message = error instanceof ApiClientError ? error.data.message : "İstek gönderilemedi"
      toast.error(message || "İstek gönderilemedi")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen grid lg:grid-cols-2">
        <AuthLeftPanel
          heading={<>Bağlantı<br />gönderildi!</>}
          description="E-posta adresinize şifre sıfırlama bağlantısı gönderdik. Gelen kutunuzu kontrol edin."
        />

        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="lg:hidden">
              <div className="flex items-center justify-center gap-2">
                <img src={wernaLogo} alt="Werna" className="h-8 w-auto" />
                <span className="text-2xl font-semibold tracking-tight">Werna</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <svg className="size-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">E-posta gönderildi</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  <span className="font-medium text-foreground">{email}</span> adresine şifre sıfırlama bağlantısı gönderildi. Bağlantı 1 saat geçerlidir.
                </p>
              </div>
            </div>

            <Button variant="ghost" className="w-full" onClick={() => setSent(false)}>
              Farklı e-posta kullan
            </Button>

            <Link to="/sign-in" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Giriş sayfasına dön
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <AuthLeftPanel
        heading={<>Şifrenizi mi<br />unuttunuz?</>}
        description="Endişelenmeyin, e-posta adresinizi girerek şifrenizi kolayca sıfırlayabilirsiniz."
      />

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Werna</h1>
            <p className="text-sm text-muted-foreground mt-1">Şifre sıfırlama</p>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Şifremi Unuttum</h2>
            <p className="text-sm text-muted-foreground">
              Şifrenizi sıfırlamak için e-posta adresinizi girin
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? "Gönderiliyor..." : "Şifre Sıfırlama Bağlantısı Gönder"}
            </Button>
          </form>

          <div className="flex items-center justify-center">
            <Link to="/sign-in" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Giriş sayfasına dön
            </Link>
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
