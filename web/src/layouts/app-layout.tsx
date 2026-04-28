import { useState, useEffect, useCallback } from "react"
import { Outlet, Link, useLocation } from "react-router"
import { useAuthStore } from "@/store/auth-store"
import AuthProvider from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import konuktanLogo from "@/assets/konuktan_logo.svg"
import { ModeToggle } from "@/components/mode-toggle"

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/settings", label: "Ayarlar", icon: Settings },
]

function LogoutDialogContent({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialogContent size="sm">
      <AlertDialogHeader>
        <AlertDialogTitle>Çıkış yapmak istiyor musunuz?</AlertDialogTitle>
        <AlertDialogDescription>
          Oturumunuz sonlandırılacak. Tekrar giriş yapmanız gerekecek.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>İptal</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Çıkış Yap</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  )
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const isActive = (path: string) => location.pathname === path

  useEffect(() => {
    onMobileClose()
  }, [location.pathname, onMobileClose])

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "??"

  return (
    <aside
      className={cn(
        "h-screen flex flex-col border-r bg-card z-40",
        // Mobile: fixed overlay drawer
        "fixed inset-y-0 left-0 w-72 transition-transform duration-300 ease-in-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        // Desktop: sticky, collapsible, always visible
        "lg:sticky lg:top-0 lg:translate-x-0 lg:transition-[width] lg:duration-300",
        collapsed ? "lg:w-16" : "lg:w-64",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center h-16 border-b px-3 shrink-0",
          collapsed ? "lg:justify-center" : "justify-between"
        )}
      >
        {/* Mobile: always show logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <img src={konuktanLogo} alt="konuktan" className="h-7 w-auto" />
          <span className="text-lg font-semibold tracking-tight select-none">Konuktan</span>
        </div>
        {/* Desktop: hide when collapsed */}
        {!collapsed && (
          <div className="hidden lg:flex items-center gap-2">
            <img src={konuktanLogo} alt="konuktan" className="h-7 w-auto" />
            <span className="text-lg font-semibold tracking-tight select-none">Konuktan</span>
          </div>
        )}
        {/* Desktop collapse toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 hidden lg:flex"
          onClick={onToggle}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </Button>
        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 lg:hidden"
          onClick={onMobileClose}
        >
          <ChevronLeft className="size-4" />
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-hidden">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Button
            key={to}
            asChild
            variant={isActive(to) ? "secondary" : "ghost"}
            className={cn(
              "w-full h-10",
              collapsed ? "lg:justify-center lg:px-0 justify-start gap-3 px-3" : "justify-start gap-3 px-3"
            )}
            title={collapsed ? label : undefined}
          >
            <Link to={to}>
              <Icon className="size-4 shrink-0" />
              <span className={cn("truncate", collapsed && "lg:hidden")}>{label}</span>
            </Link>
          </Button>
        ))}
      </nav>

      {/* User / Logout */}
      <div className={cn("border-t p-2 shrink-0", collapsed && "lg:flex lg:flex-col lg:items-center lg:gap-1")}>
        {/* Collapsed desktop */}
        <div className={cn("hidden", collapsed && "lg:flex lg:flex-col lg:items-center lg:gap-1")}>
          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary select-none">
            {initials}
          </div>
          <ModeToggle className="size-8" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Çıkış Yap"
              >
                <LogOut className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <LogoutDialogContent onConfirm={logout} />
          </AlertDialog>
        </div>

        {/* Expanded (mobile always, desktop when not collapsed) */}
        <div className={cn("flex items-center gap-2 px-1", collapsed && "lg:hidden")}>
          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0 select-none">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate leading-none mb-0.5">{user?.username}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <ModeToggle className="size-8 shrink-0" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Çıkış Yap"
              >
                <LogOut className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <LogoutDialogContent onConfirm={logout} />
          </AlertDialog>
        </div>
      </div>
    </aside>
  )
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleMobileClose = useCallback(() => setMobileOpen(false), [])

  return (
    <AuthProvider>
      <div className="min-h-screen flex">
        {/* Mobile backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={handleMobileClose}
          />
        )}

        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          mobileOpen={mobileOpen}
          onMobileClose={handleMobileClose}
        />

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Mobile top bar */}
          <header className="h-14 border-b bg-card flex items-center px-4 gap-3 lg:hidden sticky top-0 z-20 shrink-0">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setMobileOpen(true)}>
              <Menu className="size-4" />
            </Button>
            <div className="flex items-center gap-2">
              <img src={konuktanLogo} alt="Werna" className="h-6 w-auto" />
              <span className="text-base font-semibold tracking-tight">Konuktan</span>
            </div>
          </header>

          <main className="flex-1 bg-background overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </AuthProvider>
  )
}
