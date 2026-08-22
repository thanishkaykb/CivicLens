import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, HelpCircle, Shield, Search, Download, CheckCircle2, MessageSquare, Landmark, ChevronDown } from "lucide-react";
import logo from "@/assets/logo.svg";

const steps = [
  { icon: MessageSquare, label: "Tell Your Story", desc: "Explain the problem in your own words" },
  { icon: HelpCircle, label: "Answer Simple Questions", desc: "We ask only what's relevant" },
  { icon: Search, label: "We Find the Authority", desc: "Identified using official sources" },
  { icon: FileText, label: "RTI is Prepared", desc: "Professional, editable application" },
  { icon: Download, label: "Download & Submit", desc: "Export as Text, Word, or PDF" },
];

const features = [
  { icon: Shield, title: "No RTI Knowledge Needed", desc: "Tell us what happened. We handle the terminology, department identification, and legal language." },
  { icon: Landmark, title: "Verified Official Sources", desc: "Authority information sourced from government websites and official RTI portals." },
  { icon: FileText, title: "Professional Applications", desc: "Export properly formatted RTI applications in Text, Word, or PDF — ready to submit." },
  { icon: HelpCircle, title: "Adaptive Guidance", desc: "Questions adapt to your specific problem. We never ask for information you shouldn't need to know." },
];

const fup = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="CivicLens" className="h-8 w-8" />
            <span className="text-lg font-semibold tracking-tight text-foreground">CivicLens</span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a>
            <Button size="sm" className="gap-1.5" onClick={() => navigate("/new-rti")}>Start an RTI <ArrowRight className="h-3.5 w-3.5" /></Button>
          </div>
          <Button size="sm" className="gap-1.5 md:hidden" onClick={() => navigate("/new-rti")}>Start an RTI</Button>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 md:pt-28 lg:pt-32">
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="mx-auto max-w-3xl text-center">
            <motion.div variants={fup}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Free · No registration required to try
              </div>
            </motion.div>
            <motion.h1 variants={fup} className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Have a problem? <span className="text-primary">Start with your story.</span>
            </motion.h1>
            <motion.p variants={fup} className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Explain what happened in your own words. CivicLens helps you understand what information you can request, identifies the relevant authority, and prepares an editable RTI application.
            </motion.p>
            <motion.div variants={fup} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="gap-2 px-8 text-base" onClick={() => navigate("/new-rti")}>Start an RTI <ArrowRight className="h-4 w-4" /></Button>
              <Button variant="outline" size="lg" className="gap-2 px-8 text-base" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>How It Works <ChevronDown className="h-4 w-4" /></Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-border/60 bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="text-center">
            <motion.p variants={fup} className="text-sm font-semibold uppercase tracking-widest text-primary">How It Works</motion.p>
            <motion.h2 variants={fup} className="mt-3 text-3xl font-bold tracking-tight">From problem to RTI in five steps</motion.h2>
            <motion.p variants={fup} className="mx-auto mt-4 max-w-xl text-muted-foreground">You don't need to understand RTI terminology. Just tell us what happened.</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((s, i) => { const I = s.icon; return (
              <motion.div key={s.label} variants={fup} className="group flex flex-col items-center rounded-xl border border-border/70 bg-card p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><I className="h-5 w-5" /></div>
                <span className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Step {i + 1}</span>
                <h3 className="text-sm font-semibold">{s.label}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
              </motion.div>
            ); })}
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="text-center">
            <motion.p variants={fup} className="text-sm font-semibold uppercase tracking-widest text-primary">Why CivicLens</motion.p>
            <motion.h2 variants={fup} className="mt-3 text-3xl font-bold tracking-tight">Built for citizens, not lawyers</motion.h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {features.map((f) => { const I = f.icon; return (
              <motion.div key={f.title} variants={fup} className="flex gap-4 rounded-xl border border-border/70 bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><I className="h-5 w-5" /></div>
                <div><h3 className="text-base font-semibold">{f.title}</h3><p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p></div>
              </motion.div>
            ); })}
          </motion.div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
            <motion.h2 variants={fup} className="text-3xl font-bold tracking-tight">You explain the problem. <span className="text-primary">We help you figure out what to ask.</span></motion.h2>
            <motion.p variants={fup} className="mx-auto mt-4 max-w-xl text-muted-foreground">No RTI expertise required. No government jargon. Just your story, and we'll guide you through the rest.</motion.p>
            <motion.div variants={fup} className="mt-8">
              <Button size="lg" className="gap-2 px-10 text-base" onClick={() => navigate("/new-rti")}>Start Your RTI Now <ArrowRight className="h-4 w-4" /></Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="about" className="py-20">
        <div className="mx-auto max-w-3xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
            <motion.h2 variants={fup} className="text-2xl font-bold tracking-tight">About CivicLens</motion.h2>
            <motion.div variants={fup} className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>CivicLens helps citizens navigate the process of requesting information from public authorities under the Right to Information Act, 2005.</p>
              <div className="rounded-lg border border-border/70 bg-muted/40 p-4">
                <p className="text-xs font-medium text-muted-foreground"><strong className="text-foreground">Please note:</strong> CivicLens is an assistance tool. It is not a government website. It does not represent the Government of India. It does not guarantee an RTI response. Users should verify official authority and submission information before filing.</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-muted/30 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2"><img src={logo} alt="CivicLens" className="h-5 w-5" /><span className="text-sm font-medium text-muted-foreground">CivicLens</span></div>
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} CivicLens. An open civic-tech initiative.</p>
        </div>
      </footer>
    </div>
  );
}
