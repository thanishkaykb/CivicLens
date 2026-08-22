import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/Navbar";
import { toast } from "sonner";
import {
  ArrowRight, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Upload, X,
  FileText, Search, Download, Edit3, RotateCcw, Plus, Trash2, ChevronDown, ChevronUp,
  Landmark, Info, Eye,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = useCallback(async () => {
    if (!description.trim()) { toast.error("Please describe your problem"); return; }
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const result = await analyzeProblem(description);
      setAnalysis(result);
      setStep("confirm_analysis");
    } catch {
      setAnalysisError("We couldn't analyze your description. You can try again or continue manually.");
    } finally { setIsAnalyzing(false); }
  }, [description]);

  const handleStartQuestions = useCallback(async () => {
    setStep("questions");
    const q = await generateQuestions(analysis!, answers);
    setCurrentQuestion(q);
  }, [analysis, answers]);

  const handleAnswer = useCallback(async () => {
    if (!currentQuestion) return;
    let answerText = "";
    if (isUnknown) {
      answerText = "I don't know";
    } else if (currentQuestion.answerType === "multi_select") {
      answerText = multiSelections.join(", ") || "";
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
    } catch { toast.error("Could not identify authority. Please enter details manually."); }
    finally { setIsGenerating(false); }
  }, [analysis, answers]);

  const handleGenerateDraft = useCallback(async () => {
    if (!authority) return;
    setIsGenerating(true);
    setStep("draft");
    try {
      const rti = await generateRTI(analysis!, answers, authority, applicantName, applicantAddress);
      setDraft(rti);
      setEditingDraft({ ...rti });
    } catch { toast.error("Could not generate RTI draft."); }
    finally { setIsGenerating(false); }
  }, [analysis, answers, authority, applicantName, applicantAddress]);

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
      const val = editingDraft[key as keyof RTIDraft];
      setEditValues((prev) => ({ ...prev, [key]: typeof val === "string" ? val : "" }));
    }
  };

  const saveEdit = (key: string) => {
    if (editingDraft) {
      setEditingDraft({ ...editingDraft, [key]: editValues[key] });
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {/* Progress */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Step {stepIndex(step) + 1} of {STEPS.length}</span>
            <span className="text-xs font-medium text-muted-foreground">{STEPS[stepIndex(step)].label}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
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
                  <RadioGroup value={currentAnswer} onValueChange={setCurrentAnswer}>
                    {currentQuestion.options.map((opt) => (
                      <div key={opt} className="flex items-center space-x-2 rounded-xl border border-border/60 px-4 py-3 hover:bg-muted/30 transition-all cursor-pointer">
                        <RadioGroupItem value={opt} id={opt} />
                        <Label htmlFor={opt} className="cursor-pointer text-sm font-normal flex-1">{opt}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                {currentQuestion.answerType === "multi_select" && currentQuestion.options && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Select all that apply</p>
                    {currentQuestion.options.map((opt) => {
                      const checked = multiSelections.includes(opt);
                      return (
                        <div key={opt}
                          className={`flex items-center space-x-3 rounded-xl border px-4 py-3 transition-all cursor-pointer ${
                            checked ? "border-primary/40 bg-primary/5" : "border-border/60 hover:bg-muted/30"
                          }`}
                          onClick={() => setMultiSelections((prev) => checked ? prev.filter((s) => s !== opt) : [...prev, opt])}
                        >
                          <Checkbox checked={checked} onCheckedChange={() => setMultiSelections((prev) => checked ? prev.filter((s) => s !== opt) : [...prev, opt])} />
                          <Label className="cursor-pointer text-sm font-normal flex-1">{opt}</Label>
                        </div>
                      );
                    })}
                  </div>
                )}
                {currentQuestion.answerType === "yes_no" && (
                  <RadioGroup value={currentAnswer} onValueChange={setCurrentAnswer}>
                    <div className="flex gap-3">
                      {["Yes", "No", "I don't know"].map((opt) => (
                        <div key={opt} className="flex items-center space-x-2 rounded-lg border border-border/60 px-4 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer flex-1">
                          <RadioGroupItem value={opt} id={opt} />
                          <Label htmlFor={opt} className="cursor-pointer text-sm font-normal">{opt}</Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
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
              <Button onClick={() => setStep("export")} className="gap-2">Continue to Export <ArrowRight className="h-4 w-4" /></Button>
            </div>

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

            <div className="flex gap-3 pt-2 pb-8">
              <Button onClick={() => setStep("export")} className="gap-2">Continue to Export <ArrowRight className="h-4 w-4" /></Button>
              <Button variant="outline" onClick={() => setStep("authority")}>Back</Button>
            </div>
          </motion.div>
        )}

        {/* STEP: Export */}
        {step === "export" && editingDraft && (
          <motion.div key="export" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-6">
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
              <h1 className="mt-4 text-2xl font-bold tracking-tight">Your application is ready</h1>
              <p className="mt-2 text-sm text-muted-foreground">Download in your preferred format. Each version is professionally formatted and ready to submit.</p>
            </div>

            <Card className="border-border/70">
              <CardHeader><CardTitle className="text-base">Export Options</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4" onClick={handleExportText} disabled={isExporting}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
                  <div className="text-left"><p className="font-medium">Plain Text</p><p className="text-xs text-muted-foreground">Copy or download as .txt</p></div>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4" onClick={handleExportWord} disabled={isExporting}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10"><FileText className="h-5 w-5 text-blue-600" /></div>
                  <div className="text-left"><p className="font-medium">Microsoft Word</p><p className="text-xs text-muted-foreground">Download as .docx</p></div>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4" onClick={handleExportPDF} disabled={isExporting}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10"><FileText className="h-5 w-5 text-red-600" /></div>
                  <div className="text-left"><p className="font-medium">PDF</p><p className="text-xs text-muted-foreground">Download as .pdf</p></div>
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

