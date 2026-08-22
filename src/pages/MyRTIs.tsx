import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Plus, FileText, ArrowRight, Clock, MapPin, Landmark } from "lucide-react";
import { STATUS_LABELS } from "@/lib/rti-types";
import type { RTICategory, RTIStatus } from "@/lib/rti-types";

const demoApps = [
  { id: "d1", title: "Road Repair & Streetlight Maintenance", category: "roads_infrastructure" as RTICategory, location: "MG Road, Bangalore", authority: "Bruhat Bengaluru Mahanagara Palike", status: "draft" as RTIStatus, createdAt: new Date().toISOString() },
  { id: "d2", title: "Water Supply Disruption", category: "water_supply" as RTICategory, location: "Sector 15, Noida", authority: "Noida Authority", status: "ready_to_submit" as RTIStatus, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "d3", title: "Government School Infrastructure", category: "government_schools" as RTICategory, location: "Chennai Central", authority: "Director of School Education, Tamil Nadu", status: "submitted" as RTIStatus, createdAt: new Date(Date.now() - 604800000).toISOString() },
];

const statusColor: Record<RTIStatus, string> = {
  draft: "bg-muted text-muted-foreground border-border/50",
  ready_to_submit: "bg-primary/10 text-primary border-primary/20",
  submitted: "bg-accent/10 text-accent border-accent/20",
  awaiting_response: "bg-purple-50 text-purple-700 border-purple-200",
  response_received: "bg-green-50 text-green-700 border-green-200",
  closed: "bg-muted text-muted-foreground border-border/50",
};

export default function MyRTIs() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Dashboard</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">My RTIs</h1>
            <p className="mt-1 text-sm text-muted-foreground">All your RTI applications, in one place.</p>
          </div>
          <Button onClick={() => navigate("/new-rti")} className="gap-2 font-semibold">
            <Plus className="h-4 w-4" /> New RTI
          </Button>
        </div>

        <div className="mt-8 space-y-4">
          {demoApps.map((app) => (
            <Card key={app.id} className="border-border/60 hover:shadow-lg hover:border-primary/15 transition-all cursor-pointer group" onClick={() => navigate("/new-rti")}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground group-hover:scale-105 transition-transform">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold truncate">{app.title}</h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{app.location}</span>
                      <span className="flex items-center gap-1"><Landmark className="h-3 w-3" />{app.authority}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(app.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="outline" className={statusColor[app.status]}>{STATUS_LABELS[app.status]}</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {demoApps.length === 0 && (
          <div className="mt-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><FileText className="h-7 w-7" /></div>
            <h3 className="mt-5 text-lg font-bold">No applications yet</h3>
            <p className="mt-2 max-w-sm mx-auto text-sm text-muted-foreground">Describe your problem, and we'll help you draft your first RTI application.</p>
            <Button className="mt-6 gap-2 font-semibold" onClick={() => navigate("/new-rti")}>
              <Plus className="h-4 w-4" /> Start Your First RTI
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
