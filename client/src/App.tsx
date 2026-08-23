import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import DashboardPage from "@/pages/DashboardPage";
import { EducationPage, FinancePage, HealthPage, InventoryPage, NutritionPage } from "@/pages/FollowUpPages";
import NotFound from "@/pages/NotFound";
import ParticipantsPage from "@/pages/ParticipantsPage";
import { ParticipantProfilePage, StaffProfilePage } from "@/pages/ProfilePages";
import { AdministrationPage, DocumentsPage, NotificationsPage, ReportsPage } from "@/pages/RecordsPages";
import ActivityAssignmentsPage from "@/pages/ActivityAssignmentsPage";
import { ActivitiesPage, AttendancePage, LeavesPage, StaffPage } from "@/pages/TeamOpsPages";
import { Route, Switch } from "wouter";

function Workspace({ children }: { children: React.ReactNode }) { return <DashboardLayout>{children}</DashboardLayout>; }

function Router() {
  return <Switch>
    <Route path="/" component={() => <Workspace><DashboardPage /></Workspace>} />
    <Route path="/participants/:id" component={() => <Workspace><ParticipantProfilePage /></Workspace>} />
    <Route path="/participants" component={() => <Workspace><ParticipantsPage /></Workspace>} />
    <Route path="/staff/:id" component={() => <Workspace><StaffProfilePage /></Workspace>} />
    <Route path="/staff" component={() => <Workspace><StaffPage /></Workspace>} />
    <Route path="/activities" component={() => <Workspace><ActivitiesPage /></Workspace>} />
    <Route path="/activity-assignments" component={() => <Workspace><ActivityAssignmentsPage /></Workspace>} />
    <Route path="/attendance" component={() => <Workspace><AttendancePage /></Workspace>} />
    <Route path="/leaves" component={() => <Workspace><LeavesPage /></Workspace>} />
    <Route path="/education" component={() => <Workspace><EducationPage /></Workspace>} />
    <Route path="/health" component={() => <Workspace><HealthPage /></Workspace>} />
    <Route path="/nutrition" component={() => <Workspace><NutritionPage /></Workspace>} />
    <Route path="/inventory" component={() => <Workspace><InventoryPage /></Workspace>} />
    <Route path="/finance" component={() => <Workspace><FinancePage /></Workspace>} />
    <Route path="/documents" component={() => <Workspace><DocumentsPage /></Workspace>} />
    <Route path="/notifications" component={() => <Workspace><NotificationsPage /></Workspace>} />
    <Route path="/reports" component={() => <Workspace><ReportsPage /></Workspace>} />
    <Route path="/administration" component={() => <Workspace><AdministrationPage /></Workspace>} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light" switchable><TooltipProvider><Toaster richColors position="top-right" /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
