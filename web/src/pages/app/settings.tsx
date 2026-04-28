import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { Spinner } from "@/components/ui/spinner"
import { useAuthStore } from "@/store/auth-store"
import type { User } from "@/store/auth-store"
import { apiClient, ApiClientError } from "@/lib/api-client"
import { toast } from "sonner"
import { Pencil, TriangleAlertIcon } from "lucide-react"

export default function Settings() {
  const { user, logout } = useAuthStore()

  // --- Profile ---
  const [profileEditing, setProfileEditing] = useState(false)
  const [profileForm, setProfileForm] = useState({
    username: user?.username ?? "",
    email: user?.email ?? "",
  })
  const [profileLoading, setProfileLoading] = useState(false)

  const handleProfileEdit = () => {
    setProfileForm({ username: user?.username ?? "", email: user?.email ?? "" })
    setProfileEditing(true)
  }

  const handleProfileCancel = () => {
    setProfileEditing(false)
    setProfileForm({ username: user?.username ?? "", email: user?.email ?? "" })
  }

  const handleProfileSave = async () => {
    setProfileLoading(true)
    try {
      const res = await apiClient.patch<{ success: boolean; data: User }>("/api/account/me", profileForm)
      useAuthStore.setState({ user: res.data })
      setProfileEditing(false)
      toast.success("Profil bilgileri güncellendi.")
    } catch (err) {
      toast.error(err instanceof ApiClientError ? (err.data.message ?? "Profil güncellenemedi.") : "Bir hata oluştu.")
    } finally {
      setProfileLoading(false)
    }
  }

  // --- Password ---
  const [passwordEditing, setPasswordEditing] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState("")

  const handlePasswordCancel = () => {
    setPasswordEditing(false)
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    setPasswordError("")
  }

  const handlePasswordSave = async () => {
    setPasswordError("")
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Yeni şifreler eşleşmiyor.")
      return
    }
    setPasswordLoading(true)
    try {
      await apiClient.patch("/api/account/me/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success("Şifreniz güncellendi.")
      handlePasswordCancel()
    } catch (err) {
      toast.error(err instanceof ApiClientError ? (err.data.message ?? "Şifre güncellenemedi.") : "Bir hata oluştu.")
    } finally {
      setPasswordLoading(false)
    }
  }

  // --- Delete ---
  const [deleteStep, setDeleteStep] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    try {
      await apiClient.delete("/api/account/me")
      toast.success("Hesabınız silindi.")
      await logout()
    } catch (err) {
      toast.error(err instanceof ApiClientError ? (err.data.message ?? "Hesap silinemedi.") : "Bir hata oluştu.")
      setDeleteLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ayarlar</h1>
        <p className="text-sm text-muted-foreground mt-1">Hesap bilgilerinizi ve güvenlik ayarlarınızı yönetin.</p>
      </div>

      {/* Profile */}
      <SettingsSection
        title="Profil Bilgileri"
        description="Kullanıcı adınız ve e-posta adresiniz hesabınızı tanımlar."
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="username">Kullanıcı Adı</Label>
              <Input
                id="username"
                value={profileEditing ? profileForm.username : (user?.username ?? "")}
                onChange={(e) => setProfileForm((p) => ({ ...p, username: e.target.value }))}
                readOnly={!profileEditing}
                className={!profileEditing ? "bg-muted/40 cursor-default" : ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                value={profileEditing ? profileForm.email : (user?.email ?? "")}
                onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                readOnly={!profileEditing}
                className={!profileEditing ? "bg-muted/40 cursor-default" : ""}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            {profileEditing ? (
              <>
                <Button variant="outline" onClick={handleProfileCancel} disabled={profileLoading}>
                  İptal
                </Button>
                <Button onClick={handleProfileSave} disabled={profileLoading} className="min-w-24">
                  {profileLoading && <Spinner className="mr-2" />}
                  Kaydet
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={handleProfileEdit} className="gap-1.5">
                <Pencil className="size-3.5" />
                Düzenle
              </Button>
            )}
          </div>
        </div>
      </SettingsSection>

      <Divider />

      {/* Password */}
      <SettingsSection
        title="Şifre"
        description="Hesabınızı güvende tutmak için düzenli aralıklarla şifrenizi güncelleyin."
      >
        {!passwordEditing ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Mevcut Şifre</Label>
              <Input
                value="••••••••••"
                readOnly
                className="bg-muted/40 cursor-default tracking-widest max-w-sm"
              />
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setPasswordEditing(true)} className="gap-1.5">
                <Pencil className="size-3.5" />
                Değiştir
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="currentPassword">Mevcut Şifre</Label>
                <PasswordInput
                  id="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  className="max-w-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">Yeni Şifre</Label>
                <PasswordInput
                  id="newPassword"
                  value={passwordForm.newPassword}
                  onChange={(e) => {
                    setPasswordError("")
                    setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Yeni Şifre Tekrar</Label>
                <PasswordInput
                  id="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => {
                    setPasswordError("")
                    setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                  }}
                />
              </div>
            </div>
            {passwordError && (
              <p className="text-destructive text-xs">{passwordError}</p>
            )}
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="outline" onClick={handlePasswordCancel} disabled={passwordLoading}>
                İptal
              </Button>
              <Button
                onClick={handlePasswordSave}
                disabled={
                  passwordLoading ||
                  !passwordForm.currentPassword ||
                  !passwordForm.newPassword ||
                  !passwordForm.confirmPassword
                }
                className="min-w-24"
              >
                {passwordLoading && <Spinner className="mr-2" />}
                Kaydet
              </Button>
            </div>
          </div>
        )}
      </SettingsSection>

      <Divider />

      {/* Danger Zone */}
      <SettingsSection
        title="Tehlikeli Alan"
        description="Hesabınızı kalıcı olarak silin. Bu işlem geri alınamaz."
        danger
      >
        {!deleteStep ? (
          <div className="flex items-start justify-between gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <div>
              <p className="text-sm font-medium">Hesabı Sil</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tüm verileriniz kalıcı olarak silinir, bu işlem geri alınamaz.
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setDeleteStep(true)} className="shrink-0">
              Hesabı Sil
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <TriangleAlertIcon className="size-4 shrink-0" />
              <p className="text-sm font-medium">Bu işlem geri alınamaz.</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Onaylamak için kullanıcı adınızı yazın:{" "}
              <span className="font-semibold text-foreground">{user?.username}</span>
            </p>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={user?.username}
              className="max-w-sm"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => { setDeleteStep(false); setDeleteConfirm("") }}
                disabled={deleteLoading}
              >
                İptal
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== user?.username || deleteLoading}
                className="min-w-28"
              >
                {deleteLoading && <Spinner className="mr-2" />}
                Evet, Sil
              </Button>
            </div>
          </div>
        )}
      </SettingsSection>
    </div>
  )
}

function SettingsSection({
  title,
  description,
  children,
  danger,
}: {
  title: string
  description: string
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <h2 className={`text-sm font-semibold ${danger ? "text-destructive" : ""}`}>{title}</h2>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
      <div className="lg:col-span-2">
        {children}
      </div>
    </div>
  )
}

function Divider() {
  return <hr className="border-border" />
}
