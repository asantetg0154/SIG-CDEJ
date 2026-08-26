import { BadgeCheck, CalendarDays, ChartNoAxesCombined, ExternalLink, HeartPulse, LockKeyhole, Moon, ShieldCheck, Sun, UsersRound } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";

const capabilities = [
  { icon: UsersRound, title: "Parcours suivis", text: "Participants, groupes, personnel et volontaires réunis dans un même espace de travail." },
  { icon: CalendarDays, title: "Activités coordonnées", text: "Calendrier, présences, affectations et rappels internes pour les équipes du centre." },
  { icon: ChartNoAxesCombined, title: "Pilotage éclairé", text: "Indicateurs, rapports et exports pour guider les décisions opérationnelles." },
];

export default function GitHubPagesLanding() {
  const { theme, toggleTheme } = useTheme();

  return <main className="min-h-screen overflow-hidden bg-background text-foreground">
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_12%_5%,hsl(var(--primary)/0.22),transparent_33%),radial-gradient(circle_at_85%_10%,hsl(var(--accent)/0.72),transparent_30%)]" />
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
      <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"><HeartPulse className="h-5 w-5" /></span><span><span className="block text-sm font-extrabold tracking-tight">SIG-CDEJ</span><span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Centre connecté</span></span></div>
      <Button variant="outline" size="sm" onClick={toggleTheme} className="rounded-xl border-border bg-card/70 px-3"><span className="mr-2">{theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</span>{theme === "light" ? "Mode sombre" : "Mode clair"}</Button>
    </nav>

    <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-12 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:pt-20">
      <div>
        <p className="eyebrow text-primary">Plateforme de gestion CDEJ</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.03] tracking-[-0.045em] sm:text-6xl">Une gestion sereine, pour un accompagnement plus humain.</h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">SIG-CDEJ centralise le suivi des jeunes, des équipes, des activités et des ressources d’un centre, avec une attention stricte à la confidentialité.</p>
        <div className="mt-8 flex flex-wrap gap-3"><span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"><BadgeCheck className="h-4 w-4" /> Version de présentation</span><span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground"><LockKeyhole className="h-4 w-4" /> Données sensibles protégées</span></div>
      </div>
      <div className="surface-card relative overflow-hidden p-5 shadow-2xl shadow-primary/10 sm:p-7"><div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-emerald-400 to-amber-300" /><div className="flex items-center justify-between"><div><p className="eyebrow">Vue d’ensemble</p><p className="mt-1 text-xl font-bold">Situation opérationnelle</p></div><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600"><ShieldCheck className="h-5 w-5" /></span></div><div className="mt-6 grid grid-cols-2 gap-3"><Metric label="Participants suivis" value="—" tone="bg-sky-500/10 text-sky-700" /><Metric label="Équipe mobilisée" value="—" tone="bg-violet-500/10 text-violet-700" /><Metric label="Activités planifiées" value="—" tone="bg-amber-500/10 text-amber-700" /><Metric label="Données affichées" value="Aucune" tone="bg-emerald-500/10 text-emerald-700" /></div><p className="mt-5 rounded-xl bg-muted/70 p-3 text-xs leading-5 text-muted-foreground">Cette vitrine ne publie aucune donnée de bénéficiaire, de santé ou de finance.</p></div>
    </section>

    <section className="border-y border-border/70 bg-card/45"><div className="mx-auto max-w-6xl px-5 py-14 sm:px-8"><div className="max-w-2xl"><p className="eyebrow">Fonctionnalités du projet</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Un cadre unifié pour les équipes CDEJ.</h2></div><div className="mt-8 grid gap-4 md:grid-cols-3">{capabilities.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border border-border bg-background/85 p-5 shadow-sm"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div></div></section>

    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8"><div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6 sm:flex sm:items-start sm:justify-between sm:gap-8"><div><div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-200"><LockKeyhole className="h-5 w-5" /> Version publique statique</div><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">GitHub Pages affiche cette présentation, mais ne peut pas exécuter le serveur sécurisé, l’authentification, la base de données, les fichiers privés ni les rappels automatisés. L’application opérationnelle doit être hébergée sur une plateforme exécutant le service Node/Manus.</p></div><a className="mt-4 inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline sm:mt-0" href="https://github.com/asantetg0154/SIG-CDEJ" target="_blank" rel="noreferrer">Voir le dépôt <ExternalLink className="h-4 w-4" /></a></div></section>
  </main>;
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <div className="rounded-xl border border-border/70 bg-background p-4"><span className={`inline-flex rounded-lg px-2 py-1 text-sm font-bold ${tone}`}>{value}</span><p className="mt-3 text-xs font-medium text-muted-foreground">{label}</p></div>;
}
