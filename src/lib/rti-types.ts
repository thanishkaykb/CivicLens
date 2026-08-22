// Core types for CivicLens RTI application

export type RTIStatus = "draft" | "ready_to_submit" | "submitted" | "awaiting_response" | "response_received" | "closed";

export type RTICategory =
  | "roads_infrastructure"
  | "streetlights"
  | "water_supply"
  | "drainage_flooding"
  | "government_hospitals"
  | "government_schools"
  | "sanitation_waste"
  | "public_transport"
  | "government_construction"
  | "other";

export type AuthorityType = "central" | "state" | "district" | "municipal" | "local_body" | "autonomous" | "unknown";

export type AnswerType = "text" | "select" | "yes_no" | "date" | "number" | "location";

export type ApplicationType = "rti" | "complaint" | "both";

export interface ProblemAnalysis {
  primaryCategory: RTICategory;
  secondaryCategories: RTICategory[];
  location: string | null;
  timePeriod: string | null;
  statedProblem: string;
  desiredInformation: string[];
  missingInformation: string[];
  recommendedQuestionCategories: string[];
}

export interface AdaptiveQuestion {
  id: string;
  question: string;
  reason: string;
  answerType: AnswerType;
  options?: string[];
  allowsUnknown: boolean;
  category: string;
}

export interface QuestionAnswer {
  questionId: string;
  question: string;
  answer: string;
  isUnknown: boolean;
}

export interface EvidenceItem {
  id: string;
  filename: string;
  fileType: string;
  description: string;
  dateProvided?: string;
  includeInRTI: boolean;
  dataUrl?: string;
}

export interface AuthorityInfo {
  publicAuthority: string;
  department: string;
  addressedTo: string;
  authorityType: AuthorityType;
  officialAddress: string;
  officialWebsite: string;
  submissionMethod: string;
  submissionPortal?: string;
  sourceUrl: string;
  sourceTitle: string;
  dateAccessed: string;
  confidenceLevel: "high" | "medium" | "low";
  verified: boolean;
}

export interface RTIInformationRequest {
  id: string;
  text: string;
  category: string;
}

export interface RTIDraft {
  title: string;
  date: string;
  subject: string;
  introduction: string;
  informationRequests: RTIInformationRequest[];
  preferredFormat: string;
  applicantName: string;
  applicantAddress: string;
  applicantEmail: string;
  applicantPhone: string;
  closingStatement: string;
}

export interface RTIApplication {
  id: string;
  userId: string;
  title: string;
  status: RTIStatus;
  originalDescription: string;
  problemAnalysis: ProblemAnalysis | null;
  answers: QuestionAnswer[];
  evidence: EvidenceItem[];
  authority: AuthorityInfo | null;
  draft: RTIDraft | null;
  applicationType: ApplicationType;
  createdAt: string;
  updatedAt: string;
  submissionDate?: string;
  referenceNumber?: string;
}

// Category labels for display
export const CATEGORY_LABELS: Record<RTICategory, string> = {
  roads_infrastructure: "Roads & Infrastructure",
  streetlights: "Streetlights",
  water_supply: "Water Supply",
  drainage_flooding: "Drainage & Flooding",
  government_hospitals: "Government Hospitals",
  government_schools: "Government Schools",
  sanitation_waste: "Sanitation & Waste Management",
  public_transport: "Public Transport",
  government_construction: "Government Construction/Projects",
  other: "Other",
};

export const AUTHORITY_TYPE_LABELS: Record<AuthorityType, string> = {
  central: "Central Government",
  state: "State Government",
  district: "District Administration",
  municipal: "Municipal Corporation",
  local_body: "Local Body (Panchayat/Nagar Panchayat)",
  autonomous: "Autonomous Body",
  unknown: "Could not be determined",
};

export const STATUS_LABELS: Record<RTIStatus, string> = {
  draft: "Draft",
  ready_to_submit: "Ready to Submit",
  submitted: "Submitted",
  awaiting_response: "Awaiting Response",
  response_received: "Response Received",
  closed: "Closed",
};

// Demo mode flag - set to true when no AI API key is available
export const DEMO_MODE = true;
