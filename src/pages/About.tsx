import { Navbar } from "@/components/Navbar";
import { Shield, FileText, HelpCircle, Landmark } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">About</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">CivicLens</h1>
        <p className="mt-2 text-lg font-medium text-muted-foreground">Turn everyday problems into informed action.</p>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Every citizen has the right to information under the Right to Information Act, 2005. But exercising that right shouldn't require legal expertise or government connections. CivicLens exists to close that gap — making it possible for anyone to understand what information they can request, identify the right authority, and file a professional RTI application.
        </p>

        <div className="mt-12 space-y-5">
          <div className="flex gap-4 rounded-2xl border border-border/60 bg-card p-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Shield className="h-5 w-5" /></div>
            <div><h3 className="font-bold">Our Mission</h3><p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">Information is power. We believe every person should be able to access it — regardless of whether they know the right department, the right form, or the right language. CivicLens makes the RTI process accessible, clear, and actionable.</p></div>
          </div>

          <div className="flex gap-4 rounded-2xl border border-border/60 bg-card p-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><FileText className="h-5 w-5" /></div>
            <div><h3 className="font-bold">What We Do</h3><p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">You describe your problem in your own words. CivicLens analyzes the situation, asks only the relevant questions, identifies the correct public authority using verified official sources, and drafts a professional RTI application ready for submission.</p></div>
          </div>

          <div className="flex gap-4 rounded-2xl border border-border/60 bg-card p-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"><HelpCircle className="h-5 w-5" /></div>
            <div><h3 className="font-bold">What We Are Not</h3><p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">CivicLens is not a government website and does not represent the Government of India. We do not guarantee an RTI response. We are an assistance tool — designed to help you get started, not to replace professional legal advice.</p></div>
          </div>

          <div className="flex gap-4 rounded-2xl border border-border/60 bg-card p-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Landmark className="h-5 w-5" /></div>
            <div><h3 className="font-bold">Before You File</h3><p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">An RTI is a request for information — not a complaint, not a repair request, and not a guarantee of action. CivicLens prepares the application. You review, verify the authority details, and decide when and how to submit.</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
