import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, FileText, ArrowRight, Clock, MapPin, Landmark, Trash2, Pencil } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { STATUS_LABELS } from "@/lib/rti-types";
import type { RTIStatus } from "@/lib/rti-types";

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
  const applications = useQuery(api.rtiApplications.list);
  const deleteMutation = useMutation(api.rtiApplications.remove);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteMutation({ applicationId: deleteTarget.id as any });
      toast.success("Application deleted");
      setDeleteTarget(null);
    } catch { toast.error("Could not delete. Please try again."); }
    finally { setIsDeleting(false); }
  };

  const apps = applications || [];

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
          {apps.map((app) => (
            <Card key={app._id} className="border-border/60 hover:shadow-lg hover:border-primary/15 transition-all group">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4 min-w-0 cursor-pointer flex-1" onClick={() => navigate(`/new-rti?id=${app._id}`)}>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground group-hover:scale-105 transition-transform">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold truncate">{app.title}</h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {app.authority?.publicAuthority && <span className="flex items-center gap-1"><Landmark className="h-3 w-3" />{app.authority.publicAuthority}</span>}
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(app.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={statusColor[app.status]}>{STATUS_LABELS[app.status]}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/new-rti?id=${app._id}`)} className="gap-1 text-muted-foreground hover:text-primary">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget({ id: app._id, title: app.title })} className="gap-1 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {applications !== undefined && apps.length === 0 && (
          <div className="mt-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><FileText className="h-7 w-7" /></div>
            <h3 className="mt-5 text-lg font-bold">No applications yet</h3>
            <p className="mt-2 max-w-sm mx-auto text-sm text-muted-foreground">Describe your problem, and we'll help you draft your first RTI application.</p>
            <Button className="mt-6 gap-2 font-semibold" onClick={() => navigate("/new-rti")}>
              <Plus className="h-4 w-4" /> Start Your First RTI
            </Button>
          </div>
        )}

        {applications === undefined && (
          <div className="mt-16 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.title}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
