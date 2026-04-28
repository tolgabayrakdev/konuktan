import { useState } from "react"
import { useAuthStore } from "@/store/auth-store"
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
import { Spinner } from "@/components/ui/spinner"

export default function SessionExpiredDialog() {
  const sessionExpired = useAuthStore((state) => state.sessionExpired)
  const extendSession = useAuthStore((state) => state.extendSession)
  const logout = useAuthStore((state) => state.logout)
  const [loading, setLoading] = useState<"extend" | "logout" | null>(null)

  const handleExtend = async () => {
    setLoading("extend")
    await extendSession()
    setLoading(null)
  }

  const handleLogout = async () => {
    setLoading("logout")
    await logout()
    setLoading(null)
  }

  return (
    <AlertDialog open={sessionExpired}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Oturum Süreniz Doldu</AlertDialogTitle>
          <AlertDialogDescription>
            Güvenliğiniz için oturumunuz sona erdi. Devam etmek ister misiniz?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleLogout} disabled={loading !== null}>
            {loading === "logout" ? <Spinner className="mr-2" /> : null}
            Çıkış Yap
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleExtend} disabled={loading !== null}>
            {loading === "extend" ? <Spinner className="mr-2" /> : null}
            Devam Et
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
