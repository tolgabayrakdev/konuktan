import { useState, useEffect, useCallback } from "react"
import { Outlet, Link, useLocation } from "react-router"
import { useAuthStore } from "@/store/auth-store"
import { useTheme } from "@/providers/theme-provider"
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
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Menu,
  Sun,
  Moon,
  Monitor,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import konuktanLogo from "@/assets/konuktan_logo.svg"

const navItems = [
  { to: "/", label: "Anasayfa", icon: LayoutDashboard },
  { to: "/customers", label: "Müşteriler", icon: Users },
  { to: "/processes", label: "Süreçler", icon: KanbanSquare },
  { to: "/settings", label: "Ayarlar", icon: Settings },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const [logoutOpen, setLogoutOpen] = useState(false)

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??"

  const themeItems = [
    { value: "light", label: "Açık Tema", icon: Sun },
    { value: "dark", label: "Koyu Tema", icon: Moon },
    { value: "system", label: "Sistem Teması", icon: Monitor },
  ] as const

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {collapsed ? (
            <button
              className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary select-none hover:bg-primary/20 transition-colors mx-auto"
              title={user?.email}
            >
              {initials}
            </button>
          ) : (
            <button className="flex items-center gap-2 px-2 w-full py-2 rounded-md hover:bg-accent transition-colors group">
              <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0 select-none">
                {initials}
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-medium leading-normal truncate">{user?.email}</p>
              </div>
              <ChevronUp className="size-3.5 text-muted-foreground shrink-0 group-data-[state=open]:rotate-180 transition-transform" />
            </button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align={collapsed ? "center" : "start"} sideOffset={6} className="w-52">
          {themeItems.map(({ value, label, icon: Icon }) => (
            <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
              <Icon className="size-4 mr-2 shrink-0" />
              <span className="flex-1">{label}</span>
              {theme === value && <Check className="size-3.5 ml-2 shrink-0" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
            onClick={() => setLogoutOpen(true)}
          >
            <LogOut className="size-4 mr-2" />
            Çıkış Yap
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Çıkış yapmak istiyor musunuz?</AlertDialogTitle>
            <AlertDialogDescription>
              Oturumunuz sonlandırılacak. Tekrar giriş yapmanız gerekecek.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={logout}>Çıkış Yap</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation()
  const isActive = (path: string) => location.pathname === path

  useEffect(() => {
    onMobileClose()
  }, [location.pathname, onMobileClose])

  return (
    <aside
      className={cn(
        "h-screen flex flex-col border-r bg-card z-40",
        "fixed inset-y-0 left-0 w-72 transition-transform duration-300 ease-in-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
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
        <div className="flex items-center gap-2 lg:hidden">
          <img src={konuktanLogo} alt="konuktan" className="h-7 w-auto" />
          <span className="text-lg font-semibold tracking-tight select-none">Konuktan</span>
        </div>
        {!collapsed && (
          <div className="hidden lg:flex items-center gap-2">
            <img src={konuktanLogo} alt="konuktan" className="h-7 w-auto" />
            <span className="text-lg font-semibold tracking-tight select-none">Konuktan</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 hidden lg:flex"
          onClick={onToggle}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </Button>
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

      {/* Footer */}
      <div className="border-t p-2 shrink-0">
        <SidebarFooter collapsed={collapsed} />
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
          <header className="h-14 border-b bg-card flex items-center px-4 gap-3 lg:hidden sticky top-0 z-20 shrink-0">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setMobileOpen(true)}>
              <Menu className="size-4" />
            </Button>
            <div className="flex items-center gap-2">
              <img src={konuktanLogo} alt="Konuktan" className="h-6 w-auto" />
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
