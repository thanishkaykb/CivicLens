import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Plus, FileText, ArrowRight, Clock, MapPin, Landmark } from "lucide-react";
import { STATUS_LABELS } from "@/lib/rti-types";
import type { RTICategory, RTIStatus } from "@/lib/rti-types";

const demoApps = [
  { id: "d1", title: "Road Repair & Streetlight Maintenance", category: "roads_infrastructure" as RTICategory, location: "MG Road, Bangalore", authority: "BBMP", status: "draft" as RTIStatus, createdAt: new Date().toISOString() },
  { id: "d2", title: "Water Supply Disruption", category: "water_supply" as RTICategory, location: "Sector 15, Noida", authority: "Noida Authority", status: "ready_to_submit" as RTIStatus, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "d3", title: "Government School Infrastructure", category: "government_schools" as RTICategory, location: "Chennai Central", authority: "Director of School Education, TN", status: "submitted" as RTIStatus, createdAt: new Date(Date.now() - 604800000).toISOString() },
];

const statusColor: Record<RTIStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  ready_to_submit: "bg-blue-50 text-blue-700",
  submitted: "bg-amber-50 text-amber-700",
  awaiting_response: "bg-purple-50 text-purple-700",
  response_received: "bg-green-50 text-green-700",
  closed: "bg-muted text-muted-foreground",
};

export default function MyRTIs() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold tracking-tight">My RTIs</h1><p className="mt-1 text-sm text-muted-foreground">Track and manage your RTI applications.</p></div>
          <Button onClick={() => navigate("/new-rti")} className="gap-2"><Plus className="h-4 w-4" /> New RTI</Button>
        </div>
        <div className="mt-8 space-y-4">
          {demoApps.map((app) => (
            <Card key={app.id} className="border-border/70 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/new-rti")}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold truncate">{app.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{app.location}</span>
                      <span className="flex items-center gap-1"><Landmark className="h-3 w-3" />{app.authority}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(app.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge className={statusColor[app.status]}>{STATUS_LABELS[app.status]}</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
