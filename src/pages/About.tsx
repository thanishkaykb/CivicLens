import { Navbar } from "@/components/Navbar";
import { Shield, FileText, HelpCircle, Landmark } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight">About CivicLens</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          CivicLens helps citizens navigate the process of requesting information from public authorities under the Right to Information Act, 2005.
        </p>

        <div className="mt-10 space-y-6">
          <div className="flex gap-4 rounded-xl border border-border/70 bg-card p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Shield className="h-5 w-5" /></div>
            <div><h3 className="font-semibold">Our Mission</h3><p className="mt-1 text-sm text-muted-foreground leading-relaxed">Every citizen has the right to information. CivicLens makes that right accessible by removing the complexity of RTI procedures and government terminology.</p></div>
          </div>

          <div className="flex gap-4 rounded-xl border border-border/70 bg-card p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="h-5 w-5" /></div>
            <div><h3 className="font-semibold">How It Works</h3><p className="mt-1 text-sm text-muted-foreground leading-relaxed">You describe your problem in your own words. Our system analyzes it, asks relevant questions, identifies the appropriate public authority, and prepares a professional RTI application for you to review and submit.</p></div>
          </div>

          <div className="flex gap-4 rounded-xl border border-border/70 bg-card p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><HelpCircle className="h-5 w-5" /></div>
            <div><h3 className="font-semibold">What We Are Not</h3><p className="mt-1 text-sm text-muted-foreground leading-relaxed">CivicLens is not a government website. We do not represent the Government of India. We do not guarantee an RTI response. The tool does not replace professional legal advice.</p></div>
          </div>

          <div className="flex gap-4 rounded-xl border border-border/70 bg-card p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Landmark className="h-5 w-5" /></div>
            <div><h3 className="font-semibold">Important Disclaimer</h3><p className="mt-1 text-sm text-muted-foreground leading-relaxed">Users should verify official authority details and submission information before filing. An RTI is a request for information, not a complaint or repair request. CivicLens is an assistance tool to help you get started.</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
