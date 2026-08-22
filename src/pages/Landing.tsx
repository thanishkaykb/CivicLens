import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, HelpCircle, Shield, Search, Download, CheckCircle2, MessageSquare, Landmark, ChevronDown } from "lucide-react";
import logo from "@/assets/logo.svg";

const steps = [
  { icon: MessageSquare, label: "Tell Us What Happened", desc: "Describe the problem in your own words — no jargon, no forms." },
  { icon: HelpCircle, label: "We Ask the Right Questions", desc: "Adaptive guidance that adapts to your specific situation." },
  { icon: Search, label: "We Find the Right Authority", desc: "Identified and verified through official government sources." },
  { icon: FileText, label: "Your RTI Is Ready", desc: "A professional, editable application — drafted for you." },
  { icon: Download, label: "Download and Submit", desc: "Export as Text, Word, or PDF. Ready to file." },
];

const features = [
  { icon: Shield, title: "Zero Prior Knowledge Required", desc: "You don't need to understand legal language, government departments, or RTI procedures. Just describe what happened." },
  { icon: Landmark, title: "Official Sources, Verified", desc: "Authority details sourced and verified from government websites and official RTI portals — not guesswork." },
  { icon: FileText, title: "Professional-Grade Applications", desc: "Formatted, structured, and letter-ready. Export in Text, Word, or PDF with a single click." },
  { icon: HelpCircle, title: "Adaptive, Not Generic", desc: "Every application is shaped by your specific problem. We never use a one-size-fits-all template." },
];

const fup = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="CivicLens" className="h-8 w-8" />
            <span className="text-lg font-bold tracking-tight text-foreground">CivicLens</span>
          </div>
          <div className="hidden items-center gap-1 md:flex">
            <a href="#how-it-works" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">How It Works</a>
            <a href="#features" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Features</a>
            <a href="#about" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">About</a>
            <div className="ml-2 flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>Sign In</Button>
              <Button size="sm" className="gap-1.5" onClick={() => navigate("/new-rti")}>Get Started <ArrowRight className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          <Button size="sm" className="gap-1.5 md:hidden" onClick={() => navigate("/new-rti")}>Get Started</Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-primary/[0.01] to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-24 md:pt-32 lg:pt-36">
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="mx-auto max-w-3xl text-center">
            <motion.div variants={fup}>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-accent">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Turn everyday problems into informed action
              </div>
            </motion.div>
            <motion.h1 variants={fup} className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Your problem matters.{" "}
              <span className="text-primary">Now take action.</span>
            </motion.h1>
            <motion.p variants={fup} className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Describe what happened in your own words. CivicLens identifies the right authority, prepares a professional RTI application, and gives you everything you need to file it.
            </motion.p>
            <motion.div variants={fup} className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="gap-2 px-8 text-base font-semibold" onClick={() => navigate("/new-rti")}>
                Start Your RTI <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="gap-2 px-8 text-base" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
                See How It Works <ChevronDown className="h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t border-border/50 bg-muted/20 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="text-center">
            <motion.p variants={fup} className="text-xs font-bold uppercase tracking-[0.2em] text-primary">How It Works</motion.p>
            <motion.h2 variants={fup} className="mt-4 text-3xl font-bold tracking-tight">From story to submission, in five steps</motion.h2>
            <motion.p variants={fup} className="mx-auto mt-4 max-w-xl text-muted-foreground">
              No legal expertise required. No government jargon. Just your words, and a clear path forward.
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((s, i) => { const I = s.icon; return (
              <motion.div key={s.label} variants={fup} className="group relative flex flex-col items-center rounded-2xl border border-border/60 bg-card p-6 text-center shadow-sm transition-all hover:shadow-lg hover:border-primary/20">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform group-hover:scale-105">
                  <I className="h-5 w-5" />
                </div>
                <span className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Step {i + 1}</span>
                <h3 className="text-sm font-bold">{s.label}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
              </motion.div>
            ); })}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="text-center">
            <motion.p variants={fup} className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Why CivicLens</motion.p>
            <motion.h2 variants={fup} className="mt-4 text-3xl font-bold tracking-tight">Built for people, not paperwork</motion.h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {features.map((f) => { const I = f.icon; return (
              <motion.div key={f.title} variants={fup} className="flex gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:border-primary/15">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <I className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              </motion.div>
            ); })}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50 bg-muted/20 py-24">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
            <motion.h2 variants={fup} className="text-3xl font-bold tracking-tight">
              Stop wondering. <span className="text-primary">Start asking.</span>
            </motion.h2>
            <motion.p variants={fup} className="mx-auto mt-4 max-w-xl text-muted-foreground">
              You have the right to information. CivicLens helps you exercise it — clearly, confidently, and correctly.
            </motion.p>
            <motion.div variants={fup} className="mt-8">
              <Button size="lg" className="gap-2 px-10 text-base font-semibold" onClick={() => navigate("/new-rti")}>
                Start Your RTI Now <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24">
        <div className="mx-auto max-w-3xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
            <motion.h2 variants={fup} className="text-2xl font-bold tracking-tight">About CivicLens</motion.h2>
            <motion.div variants={fup} className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>CivicLens helps citizens turn everyday problems into informed action. By simplifying the RTI process, we make it possible for anyone to request information from public authorities — without legal expertise or government knowledge.</p>
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-5">
                <p className="text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">Disclaimer:</strong> CivicLens is an assistance tool — not a government website. It does not represent the Government of India, does not guarantee an RTI response, and does not replace professional legal advice. Users should verify all authority details and submission procedures before filing.</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/20 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src={logo} alt="CivicLens" className="h-5 w-5" />
            <span className="text-sm font-bold text-muted-foreground">CivicLens</span>
          </div>
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} CivicLens. Built for citizens who want answers.</p>
        </div>
      </footer>
    </div>
  );
}
