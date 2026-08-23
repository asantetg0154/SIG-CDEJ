import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { useIsMobile } from "@/hooks/useMobile";
import { Activity, Archive, Bell, BookOpenCheck, CalendarDays, ChevronDown, ClipboardCheck, FileBarChart, FileText, HeartPulse, LayoutDashboard, LogOut, Menu, Moon, Package, SearchCheck, Settings, ShieldCheck, Sun, UsersRound, WalletCards } from "lucide-react";
import { useLocation } from "wouter";
import GlobalSearch from "./GlobalSearch";

const navigation = [
  { label: "Vue d’ensemble", path: "/", icon: LayoutDashboard },
  { label: "Participants", path: "/participants", icon: UsersRound },
  { label: "Personnel & volontaires", path: "/staff", icon: ShieldCheck },
  { label: "Activités & calendrier", path: "/activities", icon: CalendarDays },
  { label: "Présences", path: "/attendance", icon: ClipboardCheck },
  { label: "Congés & permissions", path: "/leaves", icon: Activity },
  { label: "Notifications", path: "/notifications", icon: Bell },
  { label: "Suivi éducatif", path: "/education", icon: BookOpenCheck },
  { label: "Santé protégée", path: "/health", icon: HeartPulse },
  { label: "Nutrition", path: "/nutrition", icon: Archive },
  { label: "Stocks & fournisseurs", path: "/inventory", icon: Package },
  { label: "Finances protégées", path: "/finance", icon: WalletCards },
  { label: "Documents", path: "/documents", icon: FileText },
  { label: "Rapports", path: "/reports", icon: FileBarChart },
  { label: "Administration", path: "/administration", icon: Settings },
];

function roleLabel(role?: string) {
  return ({ pastor: "Pasteur", cpc: "CPC", coordinator: "Coordinateur", facilitator: "Animateur", volunteer: "Volontaire", participant: "Participant" } as Record<string, string>)[role ?? ""] ?? "Membre CDEJ";
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const active = navigation.find(item => item.path === location) ?? navigation[0];

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-9 w-9 animate-pulse rounded-xl bg-primary/25" /></div>;
  if (!user) {
    return <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,_hsl(var(--accent))_0%,_transparent_32%),linear-gradient(145deg,hsl(var(--background)),hsl(var(--muted)))] p-5"><div className="surface-card w-full max-w-md p-8 text-center"><div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground"><HeartPulse className="h-7 w-7" /></div><p className="eyebrow">SIG-CDEJ</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">Accès sécurisé au centre</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Connectez-vous pour accéder aux outils et aux données autorisés selon votre rôle.</p><Button className="mt-7 w-full" size="lg" onClick={() => startLogin()}>Se connecter</Button></div></div>;
  }

  return <SidebarProvider>
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="h-[84px] justify-center px-3">
        <button className="flex items-center gap-3 rounded-xl p-2 text-left" onClick={() => setLocation("/")} aria-label="Accéder au tableau de bord">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><HeartPulse className="h-5 w-5" /></span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden"><span className="block text-sm font-bold tracking-tight text-sidebar-foreground">SIG-CDEJ</span><span className="block text-[10px] font-medium uppercase tracking-[0.15em] text-sidebar-foreground/55">Centre connecté</span></span>
        </button>
      </SidebarHeader>
      <SidebarContent className="px-2 pb-3">
        <SidebarMenu className="gap-1">
          {navigation.map(item => <SidebarMenuItem key={item.path}>
            <SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-10 rounded-lg text-[13px]">
              <item.icon className="h-4 w-4" /><span>{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>)}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button className="flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-sidebar-accent"><Avatar className="h-8 w-8 border border-sidebar-border"><AvatarFallback className="bg-secondary text-[11px] font-bold text-secondary-foreground">{user.name?.split(" ").map(part => part[0]).slice(0, 2).join("") || "C"}</AvatarFallback></Avatar><span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><span className="block truncate text-xs font-semibold text-sidebar-foreground">{user.name || "Membre CDEJ"}</span><span className="block truncate text-[11px] text-sidebar-foreground/55">{roleLabel(user.cdejRole)}</span></span><ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/45 group-data-[collapsible=icon]:hidden" /></button></DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56"><DropdownMenuLabel>Session SIG-CDEJ</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onClick={toggleTheme}>{theme === "light" ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}{theme === "light" ? "Mode sombre" : "Mode clair"}</DropdownMenuItem><DropdownMenuItem onClick={() => setLocation("/administration")}><Settings className="mr-2 h-4 w-4" />Préférences</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Déconnexion</DropdownMenuItem></DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
    <SidebarInset className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex min-h-[84px] items-center gap-3 border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur-xl md:px-7">
        {isMobile ? <SidebarTrigger className="h-10 w-10 rounded-xl border border-border bg-card"><Menu className="h-4 w-4" /></SidebarTrigger> : <SidebarTrigger className="h-9 w-9 rounded-lg text-muted-foreground" />}
        <div className="hidden min-w-0 sm:block"><p className="eyebrow">Espace opérationnel</p><h1 className="truncate text-lg font-semibold tracking-tight">{active.label}</h1></div>
        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 md:gap-3"><div className="hidden w-full max-w-md md:block"><GlobalSearch /></div><Button variant="outline" size="icon" className="relative rounded-xl border-border bg-card md:hidden" onClick={() => setLocation("/participants")} aria-label="Rechercher"><SearchCheck className="h-4 w-4" /></Button><Button variant="outline" size="icon" className="relative rounded-xl border-border bg-card" onClick={() => setLocation("/notifications")} aria-label="Notifications"><Bell className="h-4 w-4" /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" /></Button></div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] p-4 md:p-7">{children}</main>
    </SidebarInset>
  </SidebarProvider>;
}
