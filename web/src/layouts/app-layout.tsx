import { useState, useCallback } from "react"
import { Outlet, Link, useLocation } from "react-router"
import { useAuthStore } from "@/store/auth-store"
import { useTheme } from "@/providers/theme-provider"
import AuthProvider from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet, SheetContent, SheetTrigger,
} from "@/components/ui/sheet"
import {
  LayoutDashboard, Users, KanbanSquare, Settings,
  LogOut, Menu, Sun, Moon, Monitor, Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import konuktanLogo from "@/assets/konuktan_logo.svg"

const navItems = [
  { to: "/",          label: "Anasayfa",   icon: LayoutDashboard, exact: true },
  { to: "/customers", label: "Müşteriler", icon: Users,            exact: false },
  { to: "/processes", label: "Süreçler",   icon: KanbanSquare,     exact: false },
]

function NavLinks({ onClick }: { onClick?: () => void }) {
  const location = useLocation()

  function isActive(to: string, exact: boolean) {
    if (exact) return location.pathname === to
    return location.pathname === to || location.pathname.startsWith(to + "/")
  }

  return (
    <>
      {navItems.map(({ to, label, icon: Icon, exact }) => (
        <Link
          key={to}
          to={to}
          onClick={onClick}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            isActive(to, exact)
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
          )}
        >
          <Icon className="size-4 shrink-0" />
          {label}
        </Link>
      ))}
    </>
  )
}

function UserMenu() {
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const [logoutOpen, setLogoutOpen] = useState(false)

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??"

  const themeItems = [
    { value: "light",  label: "Açık Tema",    icon: Sun },
    { value: "dark",   label: "Koyu Tema",    icon: Moon },
    { value: "system", label: "Sistem Teması", icon: Monitor },
  ] as const

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent transition-colors group">
            <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary select-none">
              {initials}
            </div>
            <span className="text-sm text-muted-foreground hidden sm:block max-w-48 truncate">
              {user?.email}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-52">
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium truncate">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
              <Settings className="size-4" />
              Ayarlar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
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

function MobileMenu() {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="size-9 md:hidden">
          <Menu className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-4 flex flex-col gap-1">
        <div className="flex items-center gap-2 px-2 py-3 mb-2 border-b">
          <img src={konuktanLogo} alt="Konuktan" className="h-6 w-auto" />
          <span className="font-semibold tracking-tight">Konuktan</span>
        </div>
        <NavLinks onClick={close} />
      </SheetContent>
    </Sheet>
  )
}

export default function AppLayout() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 h-14 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="h-full px-4 flex items-center gap-4">
            {/* Mobile hamburger */}
            <MobileMenu />

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src={konuktanLogo} alt="Konuktan" className="h-7 w-auto" />
              <span className="font-semibold tracking-tight hidden sm:block">Konuktan</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 flex-1">
              <NavLinks />
            </nav>

            {/* Spacer on mobile */}
            <div className="flex-1 md:hidden" />

            {/* User menu */}
            <UserMenu />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-background overflow-auto">
          <Outlet />
        </main>
      </div>
    </AuthProvider>
  )
}
