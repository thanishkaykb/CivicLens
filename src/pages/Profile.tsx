import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { User, Mail, LogOut, Save, Loader2, Shield } from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const updateProfile = useMutation(api.users.updateProfile);

  const [name, setName] = useState(user?.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name cannot be empty"); return; }
    setIsSaving(true);
    try {
      await updateProfile({ name: name.trim() });
      toast.success("Profile updated");
    } catch {
      toast.error("Could not update profile. Please try again.");
    } finally { setIsSaving(false); }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Account</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account details.</p>

        <div className="mt-8 space-y-6">
          {/* Profile Details */}
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Email</Label>
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm">{user?.email || "No email set"}</span>
                </div>
                <p className="text-xs text-muted-foreground">Email is managed through your authentication provider.</p>
              </div>
              <Button onClick={handleSave} disabled={isSaving || name === (user?.name || "")} className="gap-2 font-semibold">
                {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Changes</>}
              </Button>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Account Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</span><p className="mt-1 capitalize">{user?.role || "User"}</p></div>
                <div><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account Type</span><p className="mt-1">{user?.isAnonymous ? "Guest" : "Email"}</p></div>
              </div>
            </CardContent>
          </Card>

          {/* Sign Out */}
          <Card className="border-destructive/20">
            <CardContent className="flex items-center justify-between py-5">
              <div>
                <p className="text-sm font-semibold">Sign Out</p>
                <p className="text-xs text-muted-foreground">You'll need to sign in again to access your account.</p>
              </div>
              <Button variant="destructive" onClick={handleSignOut} disabled={isSigningOut} className="gap-2 shrink-0">
                {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
