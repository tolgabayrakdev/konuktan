import { useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { apiClient, ApiClientError } from "@/lib/api-client"
import { AuthLeftPanel } from "@/components/auth-left-panel"
import wernaLogo from "@/assets/werna_logo.svg"

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [loading, setLoading] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-sm">
          <h2 className="text-xl font-semibold">Geçersiz Bağlantı</h2>
          <p className="text-sm text-muted-foreground">
            Bu şifre sıfırlama bağlantısı geçersiz. Lütfen yeni bir bağlantı isteyin.
          </p>
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">
            Yeni bağlantı iste
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor")
      return
    }
    setLoading(true)
    try {
      await apiClient.post("/api/auth/reset-password", { token, newPassword })
      toast.success("Şifreniz güncellendi. Giriş yapabilirsiniz.")
      navigate("/sign-in", { replace: true })
    } catch (error) {
      const message = error instanceof ApiClientError ? error.data.message : "Şifre sıfırlanamadı"
      toast.error(message || "Şifre sıfırlanamadı")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <AuthLeftPanel
        heading={<>Yeni şifrenizi<br />belirleyin</>}
        description="Hesabınız için güçlü ve hatırlanması kolay bir şifre oluşturun."
      />

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center">
            <div className="flex items-center justify-center gap-2">
              <img src={wernaLogo} alt="Werna" className="h-8 w-auto" />
              <span className="text-2xl font-semibold tracking-tight">Werna</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Şifre sıfırlama</p>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Yeni Şifre</h2>
            <p className="text-sm text-muted-foreground">
              Hesabınız için yeni bir şifre belirleyin
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Yeni Şifre</Label>
              <PasswordInput
                id="newPassword"
                placeholder="En az 8 karakter"
                className="h-11"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Yeni Şifre Tekrar</Label>
              <PasswordInput
                id="confirmPassword"
                placeholder="Şifrenizi tekrar girin"
                className="h-11"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={loading || !newPassword || !confirmPassword}
            >
              {loading ? "Kaydediliyor..." : "Şifremi Güncelle"}
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
        </div>
      </div>
    </div>
  )
}
