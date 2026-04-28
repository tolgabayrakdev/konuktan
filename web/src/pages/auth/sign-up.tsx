import { useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { useAuthStore } from "@/store/auth-store"
import { ApiClientError } from "@/lib/api-client"
import { AuthLeftPanel } from "@/components/auth-left-panel"
import wernaLogo from "@/assets/werna_logo.svg"

export default function SignUp() {
  const register = useAuthStore((state) => state.register)
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    terms: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value
    setFormData((prev) => ({ ...prev, [e.target.name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      toast.error("Şifreler eşleşmiyor")
      return
    }
    if (!formData.terms) {
      toast.error("Kullanım koşullarını kabul etmelisiniz")
      return
    }
    if (formData.password.length < 8) {
      toast.error("Şifre en az 8 karakter olmalıdır")
      return
    }
    setLoading(true)
    try {
      await register(formData.email, formData.username, formData.password)
      setRegistered(true)
    } catch (error) {
      const message = error instanceof ApiClientError ? error.data.message : "Kayıt yapılamadı"
      toast.error(message || "Kayıt yapılamadı")
    } finally {
      setLoading(false)
    }
  }

  if (registered) {
    return (
      <div className="min-h-screen grid lg:grid-cols-2">
        <AuthLeftPanel
          heading={<>Hesabınız<br />oluşturuldu!</>}
          description="E-posta adresinizi doğruladıktan sonra platformun tüm özelliklerine erişebilirsiniz."
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
                <h2 className="text-2xl font-semibold tracking-tight">Hesabınız oluşturuldu</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Hesabınız başarıyla oluşturuldu. E-posta adresinizi doğruladıktan sonra giriş yapabilirsiniz.
                </p>
              </div>
            </div>

            <Link to="/sign-in">
              <Button className="w-full h-11">Giriş Yap</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <AuthLeftPanel
        heading={<>Yeni bir başlangıç<br />yapın</>}
        description="Dakikalar içinde hesap oluşturun ve platformumuzun tüm avantajlarından yararlanın."
      />

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Werna</h1>
            <p className="text-sm text-muted-foreground mt-1">Hesap oluşturun</p>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Kayıt olun</h2>
            <p className="text-sm text-muted-foreground">Bilgilerinizi girerek başlayın</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ornek@email.com"
                className="h-11"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Kullanıcı adı</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="kullaniciadi"
                className="h-11"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <PasswordInput
                id="password"
                name="password"
                placeholder="En az 8 karakter"
                className="h-11"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Şifrenizi tekrar girin"
                className="h-11"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                checked={formData.terms}
                onChange={handleChange}
                required
              />
              <Label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer">
                <Link to="#" className="text-primary hover:underline">Kullanım Koşulları</Link> ve{" "}
                <Link to="#" className="text-primary hover:underline">Gizlilik Politikası</Link>'nı okudum ve kabul ediyorum
              </Label>
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? "Kayıt yapılıyor..." : "Hesap Oluştur"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Zaten hesabınız var mı?{" "}
            <Link to="/sign-in" className="text-primary font-medium hover:underline">
              Giriş yapın
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
