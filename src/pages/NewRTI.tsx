import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/Navbar";
import { toast } from "sonner";
import {
  ArrowRight, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Upload, X,
  FileText, Search, Download, Edit3, RotateCcw, Plus, Trash2, ChevronDown, ChevronUp,
  Landmark, Info, Eye, Save, Copy,
} from "lucide-react";
import type {
  ProblemAnalysis, AdaptiveQuestion, QuestionAnswer, AuthorityInfo,
  RTIDraft, EvidenceItem, RTICategory,
} from "@/lib/rti-types";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/lib/rti-types";
import { analyzeProblem, generateQuestions, identifyAuthority, generateRTI, regenerateSection } from "@/lib/ai-service";
import { generateText, generateWord, generatePDF } from "@/lib/doc-generators";

type FlowStep = "input" | "analysis" | "confirm_analysis" | "questions" | "evidence" | "authority" | "draft" | "review" | "export";

const STEPS: { key: FlowStep; label: string }[] = [
  { key: "input", label: "Your Problem" },
  { key: "analysis", label: "Analysis" },
  { key: "questions", label: "Questions" },
  { key: "evidence", label: "Evidence" },
  { key: "authority", label: "Authority" },
  { key: "draft", label: "RTI Draft" },
  { key: "review", label: "Review" },
  { key: "export", label: "Export" },
];

function stepIndex(s: FlowStep): number {
  const idx = STEPS.findIndex((x) => x.key === s);
  return idx >= 0 ? idx : 0;
}

export default function NewRTI() {
  const navigate = useNavigate();
  const [step, setStep] = useState<FlowStep>("input");
  const [description, setDescription] = useState("");
  const [analysis, setAnalysis] = useState<ProblemAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<AdaptiveQuestion | null>(null);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isUnknown, setIsUnknown] = useState(false);
  const [multiSelections, setMultiSelections] = useState<string[]>([]);
  const [otherText, setOtherText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [authority, setAuthority] = useState<AuthorityInfo | null>(null);
  const [draft, setDraft] = useState<RTIDraft | null>(null);
  const [editingDraft, setEditingDraft] = useState<RTIDraft | null>(null);
  const [applicantName, setApplicantName] = useState("");
  const [applicantAddress, setApplicantAddress] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [applicationId, setApplicationId] = useState<Id<"rtiApplications"> | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [returnTo, setReturnTo] = useState<FlowStep | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();
  const saveDraftMutation = useMutation(api.rtiApplications.saveDraft);
  const existingDraft = useQuery(
    api.rtiApplications.get,
    searchParams.get("id") ? { applicationId: searchParams.get("id") as Id<"rtiApplications"> } : "skip"
  );

  useEffect(() => {
    if (existingDraft && existingDraft._id) {
      setApplicationId(existingDraft._id);
      setDescription(existingDraft.originalDescription || "");
      if (existingDraft.problemAnalysis) setAnalysis(existingDraft.problemAnalysis);
      if (existingDraft.answers) setAnswers(existingDraft.answers);
      if (existingDraft.authority) setAuthority(existingDraft.authority);
      if (existingDraft.draft) {
        setDraft(existingDraft.draft);
        setEditingDraft({ ...existingDraft.draft });
        setApplicantName(existingDraft.draft.applicantName || "");
        setApplicantAddress(existingDraft.draft.applicantAddress || "");
        setStep("review");
      }
      else if (existingDraft.authority) setStep("authority");
      else if (existingDraft.answers?.length > 0) setStep("evidence");
      else if (existingDraft.problemAnalysis) setStep("confirm_analysis");
    }
  }, [existingDraft]);

  // Ref to track last saved snapshot to avoid redundant saves
  const lastSavedRef = useRef<string>("");

  // Silent auto-save helper (no toast, no loading state)
  const autoSave = useCallback(async () => {
    const snapshot = JSON.stringify({ description, analysis, answers, authority, editingDraft, draft });
    if (snapshot === lastSavedRef.current) return; // Nothing changed
    try {
      const id = await saveDraftMutation({
        applicationId: applicationId || undefined,
        title: editingDraft?.title || draft?.title || analysis?.statedProblem?.substring(0, 80) || description.substring(0, 80) || "RTI Application",
        originalDescription: description,
        problemAnalysis: analysis || undefined,
        answers: answers.length > 0 ? answers : undefined,
        authority: authority || undefined,
        draft: editingDraft || draft || undefined,
        status: editingDraft ? "ready_to_submit" : "draft",
      });
      setApplicationId(id);
      lastSavedRef.current = snapshot;
    } catch { /* silent fail */ }
  }, [applicationId, description, analysis, answers, authority, editingDraft, draft, saveDraftMutation]);

  // Auto-save when editingDraft changes (review page edits)
  useEffect(() => {
    if (!editingDraft || !applicationId) return;
    const t = setTimeout(autoSave, 1500);
    return () => clearTimeout(t);
  }, [editingDraft, applicationId, autoSave]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (description.trim()) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [description]);

  // Manual save with toast feedback
  const handleSaveDraft = useCallback(async () => {
    setIsSavingDraft(true);
    try {
      const id = await saveDraftMutation({
        applicationId: applicationId || undefined,
        title: editingDraft?.title || draft?.title || analysis?.statedProblem?.substring(0, 80) || description.substring(0, 80) || "RTI Application",
        originalDescription: description,
        problemAnalysis: analysis || undefined,
        answers: answers.length > 0 ? answers : undefined,
        authority: authority || undefined,
        draft: editingDraft || draft || undefined,
        status: editingDraft ? "ready_to_submit" : "draft",
      });
      setApplicationId(id);
      lastSavedRef.current = JSON.stringify({ description, analysis, answers, authority, editingDraft, draft });
      toast.success("Draft saved");
    } catch { toast.error("Could not save draft"); }
    finally { setIsSavingDraft(false); }
  }, [applicationId, description, analysis, answers, authority, editingDraft, draft, saveDraftMutation]);

  const handleAnalyze = useCallback(async () => {
    if (!description.trim()) { toast.error("Please describe your problem"); return; }
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const result = await analyzeProblem(description);
      setAnalysis(result);
      if (returnTo === "review") {
        // When editing from review, skip questions and go straight to authority/regen
        setStep("confirm_analysis");
      } else {
        setStep("confirm_analysis");
      }
    } catch {
      setAnalysisError("We couldn't analyze your description. You can try again or continue manually.");
    } finally { setIsAnalyzing(false); }
  }, [description, returnTo]);

  const handleStartQuestions = useCallback(async () => {
    setStep("questions");
    // Auto-save when user confirms analysis and moves to questions
    setTimeout(() => {
      saveDraftMutation({
        applicationId: applicationId || undefined,
        title: analysis?.statedProblem?.substring(0, 80) || description.substring(0, 80) || "RTI Application",
        originalDescription: description,
        problemAnalysis: analysis || undefined,
        status: "draft",
      }).then((id) => { setApplicationId(id); lastSavedRef.current = JSON.stringify({ description, analysis, answers, authority, editingDraft, draft }); }).catch(() => {});
    }, 0);
    const q = await generateQuestions(analysis!, answers);
    setCurrentQuestion(q);
  }, [analysis, answers, applicationId, description, saveDraftMutation]);

  const handleAnswer = useCallback(async () => {
    if (!currentQuestion) return;
    let answerText = "";
    if (isUnknown) {
      answerText = "I don't know";
    } else if (currentQuestion.answerType === "multi_select") {
      const items = multiSelections.map((s) => (s === "Other" && otherText.trim()) ? `Other: ${otherText.trim()}` : s);
      answerText = items.join(", ") || "";
    } else {
      answerText = currentAnswer;
    }
    const newAnswer: QuestionAnswer = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      answer: answerText,
      isUnknown,
    };
    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    setCurrentAnswer("");
    setIsUnknown(false);
    setMultiSelections([]);
    setOtherText("");
    const next = await generateQuestions(analysis!, updatedAnswers);
    if (next) {
      setCurrentQuestion(next);
    } else {
      setStep("evidence");
    }
  }, [currentAnswer, isUnknown, currentQuestion, answers, analysis, multiSelections]);

  const handleFindAuthority = useCallback(async () => {
    setIsGenerating(true);
    setStep("authority");
    try {
      const auth = await identifyAuthority(analysis!, answers);
      setAuthority(auth);
      // Auto-save when authority is identified
      setTimeout(() => {
        saveDraftMutation({
          applicationId: applicationId || undefined,
          title: analysis?.statedProblem?.substring(0, 80) || description.substring(0, 80) || "RTI Application",
          originalDescription: description,
          problemAnalysis: analysis || undefined,
          answers: answers.length > 0 ? answers : undefined,
          authority: auth,
          status: "draft",
        }).then((id) => { setApplicationId(id); }).catch(() => {});
      }, 0);
    } catch { toast.error("Could not identify authority. Please enter details manually."); }
    finally { setIsGenerating(false); }
  }, [analysis, answers, applicationId, description, saveDraftMutation]);

  const handleGenerateDraft = useCallback(async () => {
    if (!authority) return;
    setIsGenerating(true);
    setStep("draft");
    try {
      const rti = await generateRTI(analysis!, answers, authority, applicantName, applicantAddress);
      setDraft(rti);
      setEditingDraft({ ...rti });
      setReturnTo(null);
      setStep("review");
      // Auto-save immediately after RTI is generated — this is the critical save point
      setTimeout(() => {
        saveDraftMutation({
          applicationId: applicationId || undefined,
          title: rti.title || analysis?.statedProblem?.substring(0, 80) || "RTI Application",
          originalDescription: description,
          problemAnalysis: analysis || undefined,
          answers: answers.length > 0 ? answers : undefined,
          authority: authority || undefined,
          draft: rti,
          status: "ready_to_submit",
        }).then((id) => { setApplicationId(id); }).catch(() => {});
      }, 0);
    } catch { toast.error("Could not generate RTI draft. Please try again."); }
    finally { setIsGenerating(false); }
  }, [analysis, answers, authority, applicantName, applicantAddress, applicationId, description, saveDraftMutation]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const item: EvidenceItem = {
          id: `ev_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          filename: file.name,
          fileType: file.type || "unknown",
          description: "",
          includeInRTI: false,
          dataUrl: ev.target?.result as string,
        };
        setEvidence((prev) => [...prev, item]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeEvidence = (id: string) => setEvidence((prev) => prev.filter((e) => e.id !== id));

  const handleCopyText = async () => {
    if (!editingDraft) return;
    try {
      const text = generateText(editingDraft, authority);
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch { toast.error("Could not copy. Please try again."); }
  };

  const handleExportText = async () => {
    if (!editingDraft) return;
    setIsExporting(true);
    try {
      const text = generateText(editingDraft, authority);
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RTI_Application.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Text file downloaded!");
    } catch { toast.error("Export failed. Please try again."); }
    finally { setIsExporting(false); }
  };

  const handleExportWord = async () => {
    if (!editingDraft) return;
    setIsExporting(true);
    try {
      await generateWord(editingDraft, authority);
      toast.success("Word document downloaded!");
    } catch { toast.error("Word export failed. Please try again."); }
    finally { setIsExporting(false); }
  };

  const handleExportPDF = async () => {
    if (!editingDraft) return;
    setIsExporting(true);
    try {
      await generatePDF(editingDraft, authority);
      toast.success("PDF downloaded!");
    } catch { toast.error("PDF export failed. Please try again."); }
    finally { setIsExporting(false); }
  };

  const toggleEditMode = (key: string) => {
    setEditMode((prev) => ({ ...prev, [key]: !prev[key] }));
    if (!editMode[key] && editingDraft) {
      if (key === "applicant") {
        setEditValues((prev) => ({
          ...prev,
          applicantName: editingDraft.applicantName || "",
          applicantAddress: editingDraft.applicantAddress || "",
          applicantEmail: editingDraft.applicantEmail || "",
          applicantPhone: editingDraft.applicantPhone || "",
        }));
      } else if (key === "authority" && authority) {
        setEditValues((prev) => ({
          ...prev,
          authPublicAuthority: authority.publicAuthority || "",
          authDepartment: authority.department || "",
          authAddressedTo: authority.addressedTo || "",
          authOfficialAddress: authority.officialAddress || "",
          authSubmissionMethod: authority.submissionMethod || "",
          authOfficialWebsite: authority.officialWebsite || "",
        }));
      } else {
        const val = editingDraft[key as keyof RTIDraft];
        setEditValues((prev) => ({ ...prev, [key]: typeof val === "string" ? val : "" }));
      }
    }
  };

  const saveEdit = (key: string) => {
    if (editingDraft) {
      if (key === "applicant") {
        setEditingDraft({
          ...editingDraft,
          applicantName: editValues.applicantName || editingDraft.applicantName,
          applicantAddress: editValues.applicantAddress || editingDraft.applicantAddress,
          applicantEmail: editValues.applicantEmail || editingDraft.applicantEmail,
          applicantPhone: editValues.applicantPhone || editingDraft.applicantPhone,
        });
      } else {
        setEditingDraft({ ...editingDraft, [key]: editValues[key] });
      }
    }
    setEditMode((prev) => ({ ...prev, [key]: false }));
  };

  const handleRegenerate = async (field: string) => {
    if (!editingDraft || !analysis) return;
    toast.info("Regenerating...");
    const result = await regenerateSection(field, editingDraft, analysis);
    if (result) {
      setEditingDraft({ ...editingDraft, [field]: result });
      toast.success("Section regenerated!");
    }
  };

  const addRequest = () => {
    if (!editingDraft) return;
    setEditingDraft({
      ...editingDraft,
      informationRequests: [
        ...editingDraft.informationRequests,
        { id: `req_new_${Date.now()}`, text: "", category: "user_added" },
      ],
    });
  };

  const removeRequest = (id: string) => {
    if (!editingDraft) return;
    setEditingDraft({
      ...editingDraft,
      informationRequests: editingDraft.informationRequests.filter((r) => r.id !== id),
    });
  };

  const updateRequestText = (id: string, text: string) => {
    if (!editingDraft) return;
    setEditingDraft({
      ...editingDraft,
      informationRequests: editingDraft.informationRequests.map((r) => r.id === id ? { ...r, text } : r),
    });
  };

  const progress = ((stepIndex(step) + 1) / STEPS.length) * 100;
  const currentIdx = stepIndex(step);

  // Determine which steps have data and are navigable
  const isStepAccessible = (key: FlowStep): boolean => {
    const idx = stepIndex(key);
    // Always accessible if it's the current step
    if (key === step) return true;
    // Input is always accessible
    if (key === "input") return true;
    // Confirm analysis needs analysis
    if (key === "confirm_analysis") return !!analysis;
    // Questions need analysis
    if (key === "questions") return !!analysis;
    // Evidence needs analysis
    if (key === "evidence") return !!analysis;
    // Authority needs analysis
    if (key === "authority") return !!analysis;
    // Review needs draft
    if (key === "review") return !!editingDraft;
    // Export needs draft
    if (key === "export") return !!editingDraft;
    return true;
  };

  const goToStep = (key: FlowStep) => {
    if (isStepAccessible(key)) {
      setReturnTo(null);
      setStep(key);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    if (currentIdx > 0) goToStep(STEPS[currentIdx - 1].key);
  };
  const nextStep = () => {
    if (currentIdx < STEPS.length - 1 && isStepAccessible(STEPS[currentIdx + 1].key)) {
      goToStep(STEPS[currentIdx + 1].key);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {/* Progress with navigation */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={prevStep} disabled={currentIdx === 0} className="h-7 px-2">
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs font-medium text-muted-foreground">Step {currentIdx + 1} of {STEPS.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">{STEPS[currentIdx].label}</span>
              <Button variant="ghost" size="sm" onClick={nextStep} disabled={currentIdx === STEPS.length - 1 || !isStepAccessible(STEPS[currentIdx + 1]?.key)} className="h-7 px-2">
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          {/* Clickable step dots */}
          <div className="flex items-center gap-1 mb-1">
            {STEPS.map((s, i) => (
              <button key={s.key} type="button"
                onClick={() => goToStep(s.key)}
                disabled={!isStepAccessible(s.key)}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  i === currentIdx ? "bg-primary" : isStepAccessible(s.key) ? "bg-primary/30 hover:bg-primary/50" : "bg-muted"
                }`} title={s.label}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
        {/* STEP: Input */}
        {step === "input" && (
          <motion.div key="input" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="text-2xl">Tell us what happened</CardTitle>
                <p className="text-sm text-muted-foreground">Describe the problem in your own words. No government terminology, no legal language — just your story.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Example: There are many potholes on my street and the streetlights have not been working for several months. Several accidents have happened and nobody seems to be fixing the problem."
                  className="min-h-[220px] text-base leading-relaxed resize-y"
                />
                <p className="text-xs text-muted-foreground font-medium">Write naturally. We'll handle the rest.</p>
                {analysisError && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{analysisError}</span>
                  </div>
                )}
                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <Button onClick={handleAnalyze} disabled={!description.trim() || isAnalyzing} className="gap-2">
                    {isAnalyzing ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing your problem...</> : <><Search className="h-4 w-4" /> Analyze my problem</>}
                  </Button>
                  <Button variant="outline" onClick={() => { setAnalysis({ primaryCategory: "other", secondaryCategories: [], location: null, timePeriod: null, statedProblem: description, desiredInformation: ["Information about the problem"], missingInformation: [], recommendedQuestionCategories: [] }); setStep("confirm_analysis"); }}>
                    I don't know where to start
                  </Button>
                  {returnTo === "review" && (
                    <Button variant="ghost" onClick={() => { setReturnTo(null); setStep("review"); }} className="ml-auto text-muted-foreground">
                      <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Return to Review
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* STEP: Confirm Analysis */}
        {step === "confirm_analysis" && analysis && (
          <motion.div key="analysis" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="text-2xl">Here's what we understood</CardTitle>
                <p className="text-sm text-muted-foreground">Take a moment to review. If anything is missing or incorrect, go back and refine your description.</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <div><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Problem</span><p className="mt-1 text-sm">{analysis.statedProblem}</p></div>
                  <div><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</span><p className="mt-1 text-sm"><Badge variant="secondary">{CATEGORY_LABELS[analysis.primaryCategory]}</Badge></p></div>
                  {analysis.secondaryCategories.length > 0 && (
                    <div><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Related Issues</span><div className="mt-1 flex flex-wrap gap-1.5">{analysis.secondaryCategories.map((c) => <Badge key={c} variant="outline" className="text-xs">{CATEGORY_LABELS[c]}</Badge>)}</div></div>
                  )}
                  <div><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</span><p className="mt-1 text-sm">{analysis.location || "Not provided"}</p></div>
                  <div><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration</span><p className="mt-1 text-sm">{analysis.timePeriod || "Not provided"}</p></div>
                  <div><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Possible Information Areas</span><ul className="mt-1 space-y-1">{analysis.desiredInformation.map((d, i) => <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />{d}</li>)}</ul></div>
                  {analysis.missingInformation.length > 0 && (
                    <div><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">We'll ask about</span><ul className="mt-1 space-y-1">{analysis.missingInformation.map((m, i) => <li key={i} className="flex items-start gap-2 text-sm"><Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />{m}</li>)}</ul></div>
                  )}
                </div>                    <p className="text-sm font-semibold text-muted-foreground">Is this correct?</p>
                <div className="flex gap-3">
                  <Button onClick={handleStartQuestions} className="gap-2">Yes, continue <ArrowRight className="h-4 w-4" /></Button>
                  <Button variant="outline" onClick={() => setStep("input")}><Edit3 className="mr-2 h-4 w-4" /> Edit</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* STEP: Questions */}
        {step === "questions" && currentQuestion && (
          <motion.div key={`q-${currentQuestion.id}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <Card className="border-border/70">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">A few questions</CardTitle>
                  <Badge variant="secondary">{answers.length + 1}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Answer what you can. Skip what you don't know — that's expected.</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                  <p className="text-base font-medium">{currentQuestion.question}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{currentQuestion.reason}</p>
                </div>

                {currentQuestion.answerType === "text" && (
                  <Textarea value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} placeholder="Type your answer here — include as much detail as you'd like..." className="min-h-[120px] resize-y text-sm leading-relaxed" />
                )}
                {currentQuestion.answerType === "select" && currentQuestion.options && (
                  <div className="space-y-2">
                    {currentQuestion.options.map((opt, i) => {
                      const selected = currentAnswer === opt;
                      const safeId = `sel-${currentQuestion.id}-${i}`;
                      return (
                        <button key={opt} type="button"
                          onClick={() => setCurrentAnswer(opt)}
                          className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                            selected ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : "border-border/60 hover:bg-muted/30 hover:border-border"
                          }`}
                        >
                          <div className={`flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 transition-colors ${
                            selected ? "border-primary bg-primary" : "border-muted-foreground/30"
                          }`}> {selected && <div className="h-2 w-2 rounded-full bg-primary-foreground" />} </div>
                          <span className="text-sm font-medium">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {currentQuestion.answerType === "multi_select" && currentQuestion.options && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Select all that apply</p>
                    {currentQuestion.options.map((opt, i) => {
                      const checked = multiSelections.includes(opt);
                      return (
                        <button key={opt} type="button"
                          onClick={() => setMultiSelections((prev) => checked ? prev.filter((s) => s !== opt) : [...prev, opt])}
                          className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                            checked ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : "border-border/60 hover:bg-muted/30 hover:border-border"
                          }`}
                        >
                          <div className={`flex h-4.5 w-4.5 items-center justify-center rounded-md border-2 transition-colors ${
                            checked ? "border-primary bg-primary" : "border-muted-foreground/30"
                          }`}> {checked && <svg className="h-3 w-3 text-primary-foreground" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>} </div>
                          <span className="text-sm font-medium">{opt}</span>
                        </button>
                      );
                    })}
                    {currentQuestion.options.includes("Other") && multiSelections.includes("Other") && (
                      <div className="mt-2">
                        <Input
                          value={otherText}
                          onChange={(e) => setOtherText(e.target.value)}
                          placeholder="Please specify..."
                          className="text-sm"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                )}
                {currentQuestion.answerType === "yes_no" && (
                  <div className="flex gap-3">
                    {["Yes", "No", "I don't know"].map((opt) => {
                      const selected = currentAnswer === opt;
                      return (
                        <button key={opt} type="button"
                          onClick={() => setCurrentAnswer(opt)}
                          className={`flex-1 rounded-xl border px-4 py-3 text-center transition-all ${
                            selected ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : "border-border/60 hover:bg-muted/30 hover:border-border"
                          }`}
                        >
                          <span className="text-sm font-medium">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.allowsUnknown && currentQuestion.answerType === "text" && (
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={isUnknown} onChange={(e) => { setIsUnknown(e.target.checked); if (e.target.checked) setCurrentAnswer(""); }} className="rounded" />
                    I don't know
                  </label>
                )}

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleAnswer} className="font-semibold" disabled={
                    !isUnknown &&
                    currentQuestion.answerType !== "multi_select" &&
                    !currentAnswer
                  }>
                    {!isUnknown && !currentAnswer && (currentQuestion.answerType === "multi_select" ? multiSelections.length === 0 : true) ? "Skip" : "Continue"} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="ghost" onClick={() => { setStep("evidence"); }}>Skip all questions</Button>
                  <Button variant="ghost" onClick={handleSaveDraft} disabled={isSavingDraft}><Save className="mr-1.5 h-3.5 w-3.5" />Save Draft</Button>
                  {returnTo === "review" && (
                    <Button variant="ghost" onClick={() => { setReturnTo(null); setStep("review"); }} className="ml-auto text-muted-foreground">
                      <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Return to Review
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* STEP: Evidence */}
        {step === "evidence" && (
          <motion.div key="evidence" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="text-xl">Any supporting evidence?</CardTitle>
                <p className="text-sm text-muted-foreground">Photos, documents, or other files that support your case. Completely optional — you can continue without uploading anything.</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-lg border-2 border-dashed border-border/60 p-6 text-center hover:border-primary/40 transition-colors">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Click to upload or drag and drop</p>
                  <p className="mt-1 text-xs text-muted-foreground">Images, PDFs, DOC/DOCX — anything relevant</p>
                  <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" />
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-3.5 w-3.5" /> Choose Files
                  </Button>
                </div>

                {evidence.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Uploaded Evidence</p>
                    {evidence.map((ev) => (
                      <div key={ev.id} className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="text-sm truncate">{ev.filename}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeEvidence(ev.id)} className="shrink-0"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleFindAuthority} disabled={isGenerating} className="gap-2 font-semibold">
                    {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Identifying authority...</> : <>Identify Authority <ArrowRight className="h-4 w-4" /></>}
                  </Button>
                  <Button variant="ghost" onClick={handleFindAuthority}>Continue without evidence</Button>
                  <Button variant="ghost" onClick={handleSaveDraft} disabled={isSavingDraft}><Save className="mr-1.5 h-3.5 w-3.5" />Save Draft</Button>
                  {returnTo === "review" && (
                    <Button variant="ghost" onClick={() => { setReturnTo(null); setStep("review"); }} className="ml-auto text-muted-foreground">
                      <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Return to Review
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* STEP: Authority */}
        {step === "authority" && (
          <motion.div key="authority" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {isGenerating ? (
              <Card className="border-border/70">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-4 text-sm text-muted-foreground">Searching official government sources...</p>
                </CardContent>
              </Card>
            ) : authority ? (
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle className="text-xl">Suggested Public Authority</CardTitle>
                  <p className="text-xs text-muted-foreground">Review this carefully. Confirm the authority is correct before generating your application.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      ["Public Authority", authority.publicAuthority],
                      ["Department", authority.department],
                      ["Addressed To", authority.addressedTo],
                      ["Official Address", authority.officialAddress],
                      ["Submission Method", authority.submissionMethod],
                    ].map(([label, val]) => val ? (
                      <div key={label} className="rounded-lg border border-border/60 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                        <p className="mt-1 text-sm">{val}</p>
                      </div>
                    ) : null)}
                  </div>

                  {authority.officialWebsite && (
                    <div className="rounded-lg border border-border/60 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Official Website</p>
                      <a href={authority.officialWebsite} target="_blank" rel="noopener noreferrer" className="mt-1 text-sm text-primary hover:underline">{authority.officialWebsite}</a>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Source: {authority.sourceTitle}</span>
                    <span>Accessed: {authority.dateAccessed}</span>
                    <Badge variant={authority.confidenceLevel === "high" ? "default" : "secondary"} className="text-xs">{authority.confidenceLevel} confidence</Badge>
                  </div>

                  {authority.verified && (
                    <div className="flex items-center gap-2 text-xs text-green-600"><CheckCircle2 className="h-3.5 w-3.5" /> Source verified</div>
                  )}

                  <div className="space-y-3 pt-2">
                    <div>
                      <Label className="text-xs font-semibold">Your Name (for the application)</Label>
                      <Input value={applicantName} onChange={(e) => setApplicantName(e.target.value)} placeholder="Your full name" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Your Address (for the application)</Label>
                      <Input value={applicantAddress} onChange={(e) => setApplicantAddress(e.target.value)} placeholder="Your address" className="mt-1" />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button onClick={handleGenerateDraft} disabled={isGenerating} className="gap-2">
                      {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <>Generate RTI Application <ArrowRight className="h-4 w-4" /></>}
                    </Button>
                    <Button variant="outline" onClick={() => setStep("questions")}>Go Back</Button>
                    <Button variant="ghost" onClick={handleSaveDraft} disabled={isSavingDraft}><Save className="mr-1.5 h-3.5 w-3.5" />Save Draft</Button>
                    {returnTo === "review" && (
                      <Button variant="ghost" onClick={() => { setReturnTo(null); setStep("review"); }} className="text-muted-foreground">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Return to Review
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/70">
                <CardContent className="py-16 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">We couldn't identify the authority. Please go back and provide more details.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setStep("questions")}>Go Back</Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* STEP: Draft (generating) */}
        {step === "draft" && !editingDraft && (
          <motion.div key="draft" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-border/70">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Generating your RTI application...</p>
            </CardContent>
          </Card>
          </motion.div>
        )}

        {/* STEP: Review */}
        {step === "review" && editingDraft && (
          <motion.div key="review" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">Review your RTI</h1>
              <Button onClick={() => { setStep("export"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="gap-2 font-semibold">Continue to Export <ArrowRight className="h-4 w-4" /></Button>
            </div>

            {/* Edit Details — jump back to any step */}
            <Card className="border-border/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Edit Details</CardTitle>
                <p className="text-xs text-muted-foreground">Need to change something? Jump back to any step. Your RTI will update automatically when you return.</p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Problem Description", step: "input" as FlowStep, icon: <Edit3 className="h-4 w-4" />, desc: description.substring(0, 60) + (description.length > 60 ? "..." : "") },
                    { label: "Answers", step: "questions" as FlowStep, icon: <Edit3 className="h-4 w-4" />, desc: `${answers.length} answers provided` },
                    { label: "Evidence", step: "evidence" as FlowStep, icon: <Upload className="h-4 w-4" />, desc: `${evidence.length} file(s) attached` },
                    { label: "Authority", step: "authority" as FlowStep, icon: <Landmark className="h-4 w-4" />, desc: authority?.publicAuthority || "Not identified" },
                  ].map((item) => (
                    <button key={item.step} type="button" onClick={() => { setReturnTo("review"); setStep(item.step); }}
                      className="flex flex-col items-start gap-2 rounded-xl border border-border/60 p-3 text-left transition-all hover:border-primary/30 hover:bg-primary/5"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        {item.icon} {item.label}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Subject */}
            <Card className="border-border/70">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Subject</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => toggleEditMode("subject")}><Edit3 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleRegenerate("subject")}><RotateCcw className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {editMode.subject ? (
                  <div className="flex gap-2"><Input value={editValues.subject || ""} onChange={(e) => setEditValues((p) => ({ ...p, subject: e.target.value }))} /><Button size="sm" onClick={() => saveEdit("subject")}>Save</Button></div>
                ) : <p className="text-sm">{editingDraft.subject}</p>}
              </CardContent>
            </Card>

            {/* Introduction */}
            <Card className="border-border/70">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Introduction</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => toggleEditMode("introduction")}><Edit3 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleRegenerate("introduction")}><RotateCcw className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {editMode.introduction ? (
                  <div className="space-y-2"><Textarea value={editValues.introduction || ""} onChange={(e) => setEditValues((p) => ({ ...p, introduction: e.target.value }))} className="min-h-[100px]" /><Button size="sm" onClick={() => saveEdit("introduction")}>Save</Button></div>
                ) : <p className="text-sm leading-relaxed whitespace-pre-wrap">{editingDraft.introduction}</p>}
              </CardContent>
            </Card>

            {/* Information Requests */}
            <Card className="border-border/70">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Information Requests ({editingDraft.informationRequests.length})</CardTitle>
                  <Button variant="outline" size="sm" onClick={addRequest} className="gap-1"><Plus className="h-3 w-3" /> Add</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {editingDraft.informationRequests.map((req, i) => (
                  <div key={req.id} className="group rounded-lg border border-border/60 p-3">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-xs font-bold text-muted-foreground">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        {editMode[`req_${req.id}`] ? (
                          <div className="space-y-2"><Textarea value={editValues[`req_${req.id}`] || ""} onChange={(e) => setEditValues((p) => ({ ...p, [`req_${req.id}`]: e.target.value }))} className="min-h-[60px] text-sm" /><Button size="sm" onClick={() => { updateRequestText(req.id, editValues[`req_${req.id}`] || ""); setEditMode((p) => ({ ...p, [`req_${req.id}`]: false })); }}>Save</Button></div>
                        ) : <p className="text-sm">{req.text}</p>}
                      </div>
                      <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => { toggleEditMode(`req_${req.id}`); setEditValues((p) => ({ ...p, [`req_${req.id}`]: req.text })); }}><Edit3 className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => removeRequest(req.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Applicant */}
            <Card className="border-border/70">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Applicant Information</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => toggleEditMode("applicant")}><Edit3 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                {editMode.applicant ? (
                  <div className="space-y-3">
                    {(["applicantName", "applicantAddress", "applicantEmail", "applicantPhone"] as const).map((key) => (
                      <div key={key}><Label className="text-xs font-semibold capitalize">{key.replace("applicant", "").replace(/([A-Z])/g, " $1")}</Label><Input value={editValues[key] || ""} onChange={(e) => setEditValues((p) => ({ ...p, [key]: e.target.value }))} className="mt-1" /></div>
                    ))}
                    <Button size="sm" onClick={() => { if (editingDraft) { setEditingDraft({ ...editingDraft, applicantName: editValues.applicantName || editingDraft.applicantName, applicantAddress: editValues.applicantAddress || editingDraft.applicantAddress, applicantEmail: editValues.applicantEmail || editingDraft.applicantEmail, applicantPhone: editValues.applicantPhone || editingDraft.applicantPhone }); } setEditMode((p) => ({ ...p, applicant: false })); }}>Save</Button>
                  </div>
                ) : (
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div><span className="text-muted-foreground">Name:</span> {editingDraft.applicantName}</div>
                    <div><span className="text-muted-foreground">Address:</span> {editingDraft.applicantAddress}</div>
                    <div><span className="text-muted-foreground">Email:</span> {editingDraft.applicantEmail}</div>
                    <div><span className="text-muted-foreground">Phone:</span> {editingDraft.applicantPhone}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Public Authority — editable inline */}
            <Card className="border-border/70">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Public Authority</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => toggleEditMode("authority")}><Edit3 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                {editMode.authority ? (
                  <div className="space-y-3">
                    {([
                      ["authPublicAuthority", "Public Authority"],
                      ["authDepartment", "Department"],
                      ["authAddressedTo", "Addressed To"],
                      ["authOfficialAddress", "Official Address"],
                      ["authSubmissionMethod", "Submission Method"],
                      ["authOfficialWebsite", "Official Website"],
                    ] as const).map(([field, label]) => (
                      <div key={field}><Label className="text-xs font-semibold">{label}</Label><Input value={editValues[field] || ""} onChange={(e) => setEditValues((p) => ({ ...p, [field]: e.target.value }))} className="mt-1" /></div>
                    ))}
                    <Button size="sm" onClick={() => {
                      if (authority) {
                        setAuthority({
                          ...authority,
                          publicAuthority: editValues.authPublicAuthority || authority.publicAuthority,
                          department: editValues.authDepartment || authority.department,
                          addressedTo: editValues.authAddressedTo || authority.addressedTo,
                          officialAddress: editValues.authOfficialAddress || authority.officialAddress,
                          submissionMethod: editValues.authSubmissionMethod || authority.submissionMethod,
                          officialWebsite: editValues.authOfficialWebsite || authority.officialWebsite,
                        });
                      }
                      setEditMode((p) => ({ ...p, authority: false }));
                    }}>Save</Button>
                  </div>
                ) : authority ? (
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div><span className="text-muted-foreground">Authority:</span> {authority.publicAuthority}</div>
                    <div><span className="text-muted-foreground">Department:</span> {authority.department}</div>
                    <div><span className="text-muted-foreground">Addressed To:</span> {authority.addressedTo}</div>
                    <div><span className="text-muted-foreground">Submission:</span> {authority.submissionMethod}</div>
                  </div>
                ) : <p className="text-sm text-muted-foreground">No authority identified.</p>}
              </CardContent>
            </Card>

            {/* Re-generate after edits */}
            {description && (
              <Card className="border-dashed border-primary/30 bg-primary/5">
                <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">Made changes to your details?</p>
                    <p className="text-xs text-muted-foreground">Re-generate the RTI to reflect your latest edits.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleGenerateDraft} disabled={isGenerating} className="gap-2">
                    {isGenerating ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Regenerating...</> : <><RotateCcw className="h-3.5 w-3.5" /> Re-generate RTI</>}
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3 pt-2 pb-8">
              <Button onClick={() => { setStep("export"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="gap-2 font-semibold">Continue to Export <ArrowRight className="h-4 w-4" /></Button>
              <Button variant="outline" onClick={() => setStep("authority")}>Back</Button>
              <Button variant="ghost" onClick={handleSaveDraft} disabled={isSavingDraft} className="ml-auto text-muted-foreground"><Save className="mr-1.5 h-3.5 w-3.5" />Save Draft</Button>
            </div>
          </motion.div>
        )}

        {/* STEP: Export */}
        {step === "export" && editingDraft && (
          <motion.div key="export" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-6">
            <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" />
              <div>
                <h1 className="text-lg font-bold tracking-tight">Your application is ready</h1>
                <p className="text-xs text-green-700/70">Download in your preferred format below.</p>
              </div>
            </div>

            <Card className="border-border/70">
              <CardContent className="space-y-3 pt-5">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="default" className="flex-1 justify-start gap-3 h-auto py-4" onClick={handleCopyText}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/20"><Copy className="h-5 w-5" /></div>
                    <div className="text-left"><p className="font-semibold">Copy to Clipboard</p><p className="text-xs opacity-80">Paste into any document or email</p></div>
                  </Button>
                  <Button variant="outline" className="flex-1 justify-start gap-3 h-auto py-4" onClick={handleExportText} disabled={isExporting}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
                    <div className="text-left"><p className="font-medium">Download .txt</p><p className="text-xs text-muted-foreground">Plain text file</p></div>
                  </Button>
                </div>
                <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4" onClick={handleExportWord} disabled={isExporting}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10"><FileText className="h-5 w-5 text-blue-600" /></div>
                  <div className="text-left"><p className="font-medium">Download Word (.docx)</p><p className="text-xs text-muted-foreground">12pt Times New Roman, 1.5 line spacing, professional formatting</p></div>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4" onClick={handleExportPDF} disabled={isExporting}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10"><FileText className="h-5 w-5 text-red-600" /></div>
                  <div className="text-left"><p className="font-medium">Download PDF</p><p className="text-xs text-muted-foreground">12pt Times, proper margins, page numbers, ready to print</p></div>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader>              <CardTitle className="text-base">Submission Guide</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2"><Landmark className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><div><p className="font-bold text-foreground">Where to submit</p><p>{authority?.publicAuthority || "The identified public authority"}</p></div></div>
                <Separator />
                <div className="flex items-start gap-2"><Download className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><div><p className="font-bold text-foreground">How to submit</p><p>{authority?.submissionMethod || "By post or in person at the relevant office"}</p></div></div>
                {authority?.sourceUrl && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-2"><Search className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><div><p className="font-medium text-foreground">Official RTI Portal</p><a href={authority.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{authority.sourceUrl}</a></div></div>
                  </>
                )}
                <Separator />
                <div className="rounded-lg bg-muted/30 p-3 text-xs"><strong className="text-foreground">Important:</strong> An RTI is a request for information — not a complaint or repair request. Always verify authority details and submission procedures before filing.</div>
              </CardContent>
            </Card>

            <div className="flex gap-3 pb-8">
              <Button variant="outline" onClick={() => setStep("review")}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Review</Button>
              <Button onClick={() => navigate("/my-rtis")}>Go to My RTIs</Button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}

