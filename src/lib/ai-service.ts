/**
 * AI Service Layer for CivicLens
 * 
 * Provides a configurable AI service. When no API key is configured,
 * uses demo mode with realistic simulated responses.
 */

import type {
  RTICategory,
  ProblemAnalysis,
  AdaptiveQuestion,
  AuthorityInfo,
  RTIDraft,
  QuestionAnswer,
} from "./rti-types";

// ─── DEMO DATA ───────────────────────────────────────────────────────────────

const CATEGORY_DEMO_QUESTIONS: Record<RTICategory, AdaptiveQuestion[]> = {
  roads_infrastructure: [
    {
      id: "road_location",
      question: "Where exactly is the road problem located? Please provide the street name, area, and city if you know.",
      reason: "Location is essential to identify the responsible authority",
      answerType: "text",
      allowsUnknown: true,
      category: "location",
    },
    {
      id: "road_type",
      question: "What type of road problem are you experiencing?",
      reason: "Different problems may fall under different departments",
      answerType: "select",
      options: ["Potholes", "Broken road surface", "Unpaved/under construction", "Flooding", "Encroachment", "Other"],
      allowsUnknown: true,
      category: "problem_type",
    },
    {
      id: "road_duration",
      question: "Approximately how long has this problem existed?",
      reason: "Duration helps establish the scope of information to request",
      answerType: "select",
      options: ["Less than a month", "1-6 months", "6-12 months", "1-2 years", "More than 2 years", "I don't know"],
      allowsUnknown: true,
      category: "time_period",
    },
    {
      id: "road_complaints",
      question: "Have you or anyone you know previously complained to any authority about this issue?",
      reason: "Previous complaints help identify the responsible department and establish the record trail",
      answerType: "yes_no",
      allowsUnknown: true,
      category: "previous_action",
    },
    {
      id: "road_repair",
      question: "Has any repair work been announced, started, or partially completed at this location?",
      reason: "Ongoing work may indicate a sanction or project exists",
      answerType: "yes_no",
      allowsUnknown: true,
      category: "current_status",
    },
    {
      id: "road_photos",
      question: "Do you have any photographs or videos of the road condition?",
      reason: "Visual evidence strengthens your application and provides context",
      answerType: "yes_no",
      allowsUnknown: false,
      category: "evidence",
    },
    {
      id: "road_desired",
      question: "What information do you want to find out? For example: Who is responsible? Was money allocated? Are repairs planned?",
      reason: "Understanding your goals helps craft targeted information requests",
      answerType: "text",
      allowsUnknown: true,
      category: "desired_outcome",
    },
  ],
  streetlights: [
    { id: "sl_location", question: "Where are the affected streetlights? Please provide the street name, area, and city.", reason: "Location determines the responsible municipal authority", answerType: "text", allowsUnknown: true, category: "location" },
    { id: "sl_count", question: "Approximately how many streetlights are not working?", reason: "Scale of the problem helps in identifying the scope of information", answerType: "text", allowsUnknown: true, category: "scope" },
    { id: "sl_duration", question: "How long have the streetlights been non-functional?", reason: "Duration helps establish when maintenance stopped and who was responsible", answerType: "select", options: ["Less than a month", "1-6 months", "6-12 months", "More than a year", "I don't know"], allowsUnknown: true, category: "time_period" },
    { id: "sl_reported", question: "Have you reported this issue to anyone? If so, to whom?", reason: "Previous reports help identify the responsible department", answerType: "text", allowsUnknown: true, category: "previous_action" },
    { id: "sl_safety", question: "Are there any safety concerns resulting from the non-working streetlights?", reason: "Safety impact strengthens the urgency of the request", answerType: "text", allowsUnknown: true, category: "impact" },
    { id: "sl_photos", question: "Do you have any photos or videos showing the non-working streetlights?", reason: "Visual evidence supports your application", answerType: "yes_no", allowsUnknown: false, category: "evidence" },
    { id: "sl_desired", question: "What information are you looking for? For example: Who maintains these lights? Is there a maintenance contract? Are replacements planned?", reason: "Clarifying the information need helps formulate specific RTI requests", answerType: "text", allowsUnknown: true, category: "desired_outcome" },
  ],
  drainage_flooding: [
    { id: "drain_location", question: "Where does the flooding or drainage problem occur? Please provide the area, street, and city.", reason: "Location is needed to identify the responsible authority", answerType: "text", allowsUnknown: true, category: "location" },
    { id: "drain_frequency", question: "How frequently does flooding occur?", reason: "Frequency indicates the severity and helps identify the scope of the issue", answerType: "select", options: ["Every time it rains", "During heavy rain only", "Weekly", "Monthly", "Rarely", "I don't know"], allowsUnknown: true, category: "severity" },
    { id: "drain_since", question: "Since when has this been happening?", reason: "Timeline helps establish when the problem started and what records may exist", answerType: "text", allowsUnknown: true, category: "time_period" },
    { id: "drain_system", question: "Is there an existing drainage system in the area?", reason: "Existing infrastructure affects the type of information that can be requested", answerType: "yes_no", allowsUnknown: true, category: "infrastructure" },
    { id: "drain_work", question: "Has any drainage or flood-related work been carried out in this area?", reason: "Past work indicates whether records and projects exist", answerType: "yes_no", allowsUnknown: true, category: "current_status" },
    { id: "drain_complaints", question: "Have complaints been filed regarding this drainage issue?", reason: "Previous complaints help trace the record trail", answerType: "text", allowsUnknown: true, category: "previous_action" },
    { id: "drain_photos", question: "Do you have photos or videos of the flooding or drainage problem?", reason: "Visual evidence supports your request", answerType: "yes_no", allowsUnknown: false, category: "evidence" },
  ],
  water_supply: [
    { id: "water_location", question: "Which area or locality is affected by the water supply issue?", reason: "Location determines the responsible water authority", answerType: "text", allowsUnknown: true, category: "location" },
    { id: "water_type", question: "What is the nature of the water supply problem?", reason: "Different problems fall under different departments or agencies", answerType: "select", options: ["No water supply", "Low water pressure", "Contaminated water", "Irregular supply", "Water logging", "Other"], allowsUnknown: true, category: "problem_type" },
    { id: "water_duration", question: "How long has this water supply issue been occurring?", reason: "Duration helps understand the scope of the problem", answerType: "text", allowsUnknown: true, category: "time_period" },
    { id: "water_complaints", question: "Have you complained to any water authority or municipal body about this?", reason: "Previous complaints help identify the responsible department", answerType: "text", allowsUnknown: true, category: "previous_action" },
    { id: "water_photos", question: "Do you have any supporting evidence such as photos or documents?", reason: "Evidence strengthens your application", answerType: "yes_no", allowsUnknown: false, category: "evidence" },
  ],
  government_hospitals: [
    { id: "hospital_name", question: "Which government hospital are you referring to? Please provide the name and location if you know.", reason: "Hospital identity is essential to identify the authority", answerType: "text", allowsUnknown: true, category: "location" },
    { id: "hospital_issue", question: "What service or problem did you experience at the hospital?", reason: "The nature of the issue determines what information can be requested", answerType: "text", allowsUnknown: true, category: "problem_type" },
    { id: "hospital_when", question: "When did you experience this issue?", reason: "Date helps establish the timeframe for information requests", answerType: "text", allowsUnknown: true, category: "time_period" },
    { id: "hospital_unavailable", question: "Was any service or medication unavailable that should have been available?", reason: "This helps determine if supply records and procurement information can be requested", answerType: "text", allowsUnknown: true, category: "specifics" },
    { id: "hospital_purchased", question: "Were you asked to purchase anything externally (medicines, supplies, etc.) that should have been provided?", reason: "External purchase requests may indicate procurement or supply chain issues", answerType: "text", allowsUnknown: true, category: "specifics" },
    { id: "hospital_docs", question: "Do you have any prescriptions, bills, or documents from your hospital visit?", reason: "Documents help substantiate your request", answerType: "yes_no", allowsUnknown: false, category: "evidence" },
  ],
  government_schools: [
    { id: "school_name", question: "Which government school? Please provide the name and area if you know.", reason: "School identity is needed to identify the education authority", answerType: "text", allowsUnknown: true, category: "location" },
    { id: "school_issue", question: "What issue or problem are you experiencing with the school?", reason: "The nature of the issue determines what information to request", answerType: "text", allowsUnknown: true, category: "problem_type" },
    { id: "school_facility", question: "Which facility or service is affected?", reason: "Specific facilities help narrow the scope of information requests", answerType: "select", options: ["Building/Infrastructure", "Teachers/Staff", "Mid-day meals", "Toilets/Sanitation", "Drinking water", "Books/Supplies", "Other"], allowsUnknown: true, category: "facility" },
    { id: "school_since", question: "Since when has this issue existed?", reason: "Timeline helps establish what records may exist", answerType: "text", allowsUnknown: true, category: "time_period" },
    { id: "school_reported", question: "Has this issue been reported to the school or education department?", reason: "Previous reports help trace the record trail", answerType: "text", allowsUnknown: true, category: "previous_action" },
    { id: "school_docs", question: "Do you have any supporting documents or photos?", reason: "Evidence strengthens your application", answerType: "yes_no", allowsUnknown: false, category: "evidence" },
  ],
  sanitation_waste: [
    { id: "waste_location", question: "Where is the sanitation or waste management problem? Please provide the area and city.", reason: "Location identifies the responsible municipal authority", answerType: "text", allowsUnknown: true, category: "location" },
    { id: "waste_type", question: "What type of sanitation or waste problem are you experiencing?", reason: "Different problems may fall under different departments", answerType: "select", options: ["Garbage not collected", "Open dumping", "Overflowing bins", "Stagnant water", "Stray animals", "Public toilet issues", "Other"], allowsUnknown: true, category: "problem_type" },
    { id: "waste_duration", question: "How long has this been going on?", reason: "Duration helps establish the scope of the issue", answerType: "text", allowsUnknown: true, category: "time_period" },
    { id: "waste_complaints", question: "Have you complained to the municipal corporation or any other authority?", reason: "Previous complaints help identify the responsible department", answerType: "text", allowsUnknown: true, category: "previous_action" },
    { id: "waste_photos", question: "Do you have photos or videos of the issue?", reason: "Visual evidence strengthens your application", answerType: "yes_no", allowsUnknown: false, category: "evidence" },
  ],
  public_transport: [
    { id: "transport_location", question: "Which area or route is affected by the public transport issue?", reason: "Location determines the responsible transport authority", answerType: "text", allowsUnknown: true, category: "location" },
    { id: "transport_type", question: "What type of public transport are you referring to?", reason: "Different transport modes may be managed by different authorities", answerType: "select", options: ["City bus", "State bus (APSRTC/BEST/etc.)", "Metro", "Auto-rickshaw", "Railway", "Other"], allowsUnknown: true, category: "transport_mode" },
    { id: "transport_issue", question: "What is the specific problem?", reason: "The nature of the problem determines what information to request", answerType: "text", allowsUnknown: true, category: "problem_type" },
    { id: "transport_photos", question: "Do you have any supporting evidence?", reason: "Evidence helps substantiate your request", answerType: "yes_no", allowsUnknown: false, category: "evidence" },
  ],
  government_construction: [
    { id: "govt_location", question: "Where is the government construction or project? Please provide the area and city.", reason: "Location is essential to identify the responsible department", answerType: "text", allowsUnknown: true, category: "location" },
    { id: "govt_project", question: "What type of government construction or project are you referring to?", reason: "Project type determines which department or agency is responsible", answerType: "text", allowsUnknown: true, category: "problem_type" },
    { id: "govt_status", question: "What is the current status of the project?", reason: "Status helps identify what information may be available", answerType: "select", options: ["Not started", "Under construction", "Partially completed", "Stalled/Abandoned", "Completed but issues", "Other"], allowsUnknown: true, category: "status" },
    { id: "govt_photos", question: "Do you have any photos or documents related to this project?", reason: "Evidence strengthens your application", answerType: "yes_no", allowsUnknown: false, category: "evidence" },
  ],
  other: [
    { id: "other_location", question: "Where is this problem located? Please provide the area and city if you know.", reason: "Location helps identify the responsible authority", answerType: "text", allowsUnknown: true, category: "location" },
    { id: "other_dept", question: "Do you know which government department or authority might be responsible?", reason: "If known, this helps narrow down the authority", answerType: "text", allowsUnknown: true, category: "authority_hint" },
    { id: "other_duration", question: "How long has this problem been going on?", reason: "Duration helps establish the scope of information to request", answerType: "text", allowsUnknown: true, category: "time_period" },
    { id: "other_desired", question: "What information do you want to find out? What would be most helpful for you?", reason: "Your goals help craft targeted information requests", answerType: "text", allowsUnknown: true, category: "desired_outcome" },
    { id: "other_docs", question: "Do you have any supporting documents or evidence?", reason: "Evidence strengthens your application", answerType: "yes_no", allowsUnknown: false, category: "evidence" },
  ],
};

// ─── CATEGORY DETECTION ──────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<RTICategory, string[]> = {
  roads_infrastructure: ["pothole", "road", "pavement", "sidewalk", "footpath", "asphalt", "tar", "road work", "road repair", "bridge", "flyover", "traffic signal"],
  streetlights: ["streetlight", "street light", "lamp post", "street lamp", "light not working", "no light", "dark street", "broken light"],
  water_supply: ["water", "pipe", "borewell", "water tank", "water supply", "no water", "low pressure", "contaminated water", "water quality"],
  drainage_flooding: ["drain", "drainage", "flood", "flooding", "waterlogging", "water logging", "sewage", "overflow", "storm water"],
  government_hospitals: ["hospital", "clinic", "doctor", "medicine", "medical", "patient", "health center", "pharmacy", "ambulance", "surgery"],
  government_schools: ["school", "teacher", "student", "education", "classroom", "mid-day meal", "textbook", "exam"],
  sanitation_waste: ["garbage", "waste", "trash", "dustbin", "sanitation", "sewage", "toilet", "cleaning", "swachh", "hygiene"],
  public_transport: ["bus", "train", "metro", "auto", "transport", "route", "schedule", "fare", "station"],
  government_construction: ["construction", "project", "building", "tender", "contractor", "government building", "public works", "pwb"],
  other: [],
};

function detectCategory(text: string): RTICategory {
  const lower = text.toLowerCase();
  let bestCategory: RTICategory = "other";
  let bestScore = 0;
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [RTICategory, string[]][]) {
    let score = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) score += keyword.split(" ").length;
    }
    if (score > bestScore) { bestScore = score; bestCategory = category; }
  }
  return bestCategory;
}

function detectSecondaryCategories(text: string, primary: RTICategory): RTICategory[] {
  const lower = text.toLowerCase();
  const secondary: RTICategory[] = [];
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [RTICategory, string[]][]) {
    if (category === primary || category === "other") continue;
    let score = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) score += keyword.split(" ").length;
    }
    if (score > 0) secondary.push(category);
  }
  return secondary;
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

export async function analyzeProblem(description: string): Promise<ProblemAnalysis> {
  await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));
  const primaryCategory = detectCategory(description);
  const secondaryCategories = detectSecondaryCategories(description, primaryCategory);

  let location: string | null = null;
  const locationPatterns = [/(?:in|at|near|on|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g];
  for (const pattern of locationPatterns) {
    const match = pattern.exec(description);
    if (match) { location = match[0]; break; }
  }

  let timePeriod: string | null = null;
  const timePatterns = [/(\\d+)\\s*(?:months?|weeks?|days?|years?)\\s*(?:ago|back|since)/i];
  for (const pattern of timePatterns) {
    const match = pattern.exec(description);
    if (match) { timePeriod = match[0]; break; }
  }

  const desiredInformation: string[] = [];
  const lower = description.toLowerCase();
  if (lower.includes("who") || lower.includes("responsible")) desiredInformation.push("Responsible authority and officials");
  if (lower.includes("money") || lower.includes("fund") || lower.includes("budget")) desiredInformation.push("Budget allocation and expenditure details");
  if (lower.includes("repair") || lower.includes("fix")) desiredInformation.push("Planned repair or maintenance work");
  if (lower.includes("complaint")) desiredInformation.push("Previous complaints and their status");
  if (desiredInformation.length === 0) desiredInformation.push("Information about the problem and responsible authority");

  return {
    primaryCategory,
    secondaryCategories,
    location,
    timePeriod,
    statedProblem: description.substring(0, 200),
    desiredInformation,
    missingInformation: [!location ? "Specific location/address" : null, !timePeriod ? "Duration of the problem" : null].filter(Boolean) as string[],
    recommendedQuestionCategories: ["location", "time_period", "previous_action", "desired_outcome"],
  };
}

export async function generateQuestions(analysis: ProblemAnalysis, answeredQuestions: QuestionAnswer[]): Promise<AdaptiveQuestion | null> {
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 500));
  const categoryQuestions = CATEGORY_DEMO_QUESTIONS[analysis.primaryCategory] || CATEGORY_DEMO_QUESTIONS.other;
  const answeredIds = new Set(answeredQuestions.map((a) => a.questionId));
  return categoryQuestions.find((q) => !answeredIds.has(q.id)) || null;
}

export function getAllQuestionsForCategory(category: RTICategory): AdaptiveQuestion[] {
  return CATEGORY_DEMO_QUESTIONS[category] || CATEGORY_DEMO_QUESTIONS.other;
}

export async function identifyAuthority(analysis: ProblemAnalysis, answers: QuestionAnswer[]): Promise<AuthorityInfo> {
  await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));
  const locationAnswer = answers.find((a) => a.questionId.includes("location"));
  const location = locationAnswer?.answer || analysis.location || "the relevant area";
  const city = location.split(",").pop()?.trim() || "the city";
  const baseDate = new Date().toISOString().split("T")[0];

  const authorityMap: Partial<Record<RTICategory, Partial<AuthorityInfo>>> = {
    roads_infrastructure: {
      publicAuthority: `Public Works Department (PWD), ${city}`, department: "Roads & Buildings Division",
      addressedTo: "The Public Information Officer", authorityType: "state",
      officialAddress: `Office of the Executive Engineer, PWD, ${city}`, officialWebsite: "https://pwd.gov.in",
      submissionMethod: "Written application by post or in person at the PWD office, or through the respective state's RTI portal",
      sourceUrl: "https://rtionline.gov.in", sourceTitle: "Central Information Commission - RTI Online Portal", confidenceLevel: "medium",
    },
    streetlights: {
      publicAuthority: `Municipal Corporation, ${city}`, department: "Electrical/Maintenance Department",
      addressedTo: "The Public Information Officer", authorityType: "municipal",
      officialAddress: `Municipal Corporation Office, ${city}`, officialWebsite: "",
      submissionMethod: "Written application by post or in person at the Municipal Corporation office",
      sourceUrl: "https://rtionline.gov.in", sourceTitle: "Central Information Commission - RTI Online Portal", confidenceLevel: "medium",
    },
    drainage_flooding: {
      publicAuthority: `Municipal Corporation / Public Works Department, ${city}`, department: "Drainage & Sanitation Division",
      addressedTo: "The Public Information Officer", authorityType: "municipal",
      officialAddress: `Municipal Corporation Office, ${city}`, officialWebsite: "",
      submissionMethod: "Written application by post or in person at the Municipal Corporation or PWD office",
      sourceUrl: "https://rtionline.gov.in", sourceTitle: "Central Information Commission - RTI Online Portal", confidenceLevel: "medium",
    },
    water_supply: {
      publicAuthority: `Municipal Water Board / Water Supply Department, ${city}`, department: "Water Supply & Distribution",
      addressedTo: "The Public Information Officer", authorityType: "municipal",
      officialAddress: `Water Board Office, ${city}`, officialWebsite: "",
      submissionMethod: "Written application by post or in person at the Water Board office",
      sourceUrl: "https://rtionline.gov.in", sourceTitle: "Central Information Commission - RTI Online Portal", confidenceLevel: "medium",
    },
    government_hospitals: {
      publicAuthority: `Directorate of Health Services / Hospital Administration, ${city}`, department: "Health & Family Welfare",
      addressedTo: "The Public Information Officer", authorityType: "state",
      officialAddress: `Office of the Director of Health Services, ${city}`, officialWebsite: "",
      submissionMethod: "Written application by post or in person at the hospital or Health Department office",
      sourceUrl: "https://rtionline.gov.in", sourceTitle: "Central Information Commission - RTI Online Portal", confidenceLevel: "medium",
    },
    government_schools: {
      publicAuthority: `District Education Officer / Directorate of Public Instruction, ${city}`, department: "Education Department",
      addressedTo: "The Public Information Officer", authorityType: "state",
      officialAddress: `Office of the District Education Officer, ${city}`, officialWebsite: "",
      submissionMethod: "Written application by post or in person at the Education Department office",
      sourceUrl: "https://rtionline.gov.in", sourceTitle: "Central Information Commission - RTI Online Portal", confidenceLevel: "medium",
    },
  };

  const fallback: AuthorityInfo = {
    publicAuthority: `Relevant Public Authority, ${city}`, department: "General Administration",
    addressedTo: "The Public Information Officer", authorityType: "unknown",
    officialAddress: `Government Office, ${city}`, officialWebsite: "",
    submissionMethod: "Written application by post or in person, or through the state RTI portal",
    sourceUrl: "https://rtionline.gov.in", sourceTitle: "Central Information Commission - RTI Online Portal",
    confidenceLevel: "low", verified: false, dateAccessed: baseDate,
  };

  const mapped = authorityMap[analysis.primaryCategory] || {};
  return { ...fallback, ...mapped, dateAccessed: baseDate, verified: mapped.confidenceLevel === "high" };
}

export async function generateRTI(
  analysis: ProblemAnalysis,
  answers: QuestionAnswer[],
  _authority: AuthorityInfo,
  applicantName: string,
  applicantAddress: string,
): Promise<RTIDraft> {
  await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));
  const locationAnswer = answers.find((a) => a.questionId.includes("location"));
  const location = locationAnswer?.answer || "the concerned area";
  const durationAnswer = answers.find((a) => a.questionId.includes("duration") || a.questionId.includes("since"));
  const duration = durationAnswer?.answer || "the past several months";
  const desiredAnswer = answers.find((a) => a.questionId.includes("desired"));
  const desired = desiredAnswer?.answer || "";

  const requests: { id: string; text: string; category: string }[] = [];
  const categoryRequests: Record<RTICategory, string[]> = {
    roads_infrastructure: [
      `Please provide complete details of any road repair, resurfacing, pothole repair, or maintenance work sanctioned, proposed, undertaken, or completed at ${location} during ${duration}, including sanction orders, work orders, and related records.`,
      `Please provide copies of all complaints received by the department regarding the road condition at ${location}, along with action taken on each complaint and current status.`,
      `Please provide details of the contractor(s) responsible for road maintenance in the ${location} area, including their contract agreement and performance records.`,
      `Please provide details of the budget allocation, expenditure, and fund utilization for road maintenance and repair in the ${location} area during ${duration}.`,
      `Please provide the names and designations of the officers responsible for road maintenance in the ${location} area, along with their contact details.`,
      `Please provide details of any inspection reports, survey reports, or condition assessments conducted for the road at ${location}.`,
    ],
    streetlights: [
      `Please provide complete details of the maintenance arrangement for streetlights in ${location}, including the responsible contractor or department and current contract status.`,
      `Please provide records of all complaints received regarding non-functional streetlights in ${location} during ${duration}, along with action taken on each complaint.`,
      `Please provide details of the budget allocated for streetlight maintenance in ${location} during ${duration} and how it has been utilized.`,
      `Please provide details of any planned repair or replacement work for streetlights in ${location}.`,
      `Please provide the names and designations of officers responsible for streetlight maintenance in the ${location} area.`,
    ],
    drainage_flooding: [
      `Please provide details of the drainage system and its maintenance arrangements in ${location}.`,
      `Please provide copies of all complaints and reports regarding drainage and flooding in ${location} during ${duration}.`,
      `Please provide details of any drainage improvement, repair, or desilting work carried out or planned in ${location}.`,
      `Please provide the budget allocation and expenditure for drainage maintenance in ${location} during ${duration}.`,
      `Please provide the names and designations of officers responsible for drainage in the ${location} area.`,
    ],
    water_supply: [
      `Please provide details of the water supply infrastructure and maintenance arrangements for ${location}.`,
      `Please provide records of all complaints regarding water supply in ${location} during ${duration}.`,
      `Please provide details of any repair or improvement work carried out or planned for water supply in ${location}.`,
      `Please provide the budget allocation and expenditure for water supply in ${location} during ${duration}.`,
      `Please provide the names and designations of officers responsible for water supply in ${location}.`,
    ],
    government_hospitals: [
      `Please provide details of the staff strength and vacancy position at the hospital during ${duration}.`,
      `Please provide records of all complaints received at the hospital during ${duration} and action taken on each.`,
      `Please provide details of medicine and supply procurement during ${duration}.`,
      `Please provide the budget allocation and expenditure for the hospital during ${duration}.`,
      `Please provide the names and designations of the hospital administration and officers in charge.`,
    ],
    government_schools: [
      `Please provide details of the staff strength, vacancies, and attendance records at the school during ${duration}.`,
      `Please provide records of all complaints and representations received regarding the school during ${duration}.`,
      `Please provide details of mid-day meal scheme implementation, budget, and expenditure at the school.`,
      `Please provide details of infrastructure maintenance, repair work, and budget for the school.`,
      `Please provide the names and designations of the headmaster and school management committee members.`,
    ],
    sanitation_waste: [
      `Please provide details of the waste collection and sanitation arrangements for ${location}.`,
      `Please provide records of all complaints regarding sanitation in ${location} during ${duration}.`,
      `Please provide details of any sanitation improvement work carried out or planned in ${location}.`,
      `Please provide the budget allocation and expenditure for sanitation in ${location} during ${duration}.`,
      `Please provide the names and designations of officers responsible for sanitation in ${location}.`,
    ],
    public_transport: [
      `Please provide details of the public transport routes and services in ${location}.`,
      `Please provide records of all complaints received regarding public transport in ${location} during ${duration}.`,
      `Please provide details of any improvements or changes to public transport services in ${location}.`,
      `Please provide the budget allocation and expenditure for public transport in ${location} during ${duration}.`,
    ],
    government_construction: [
      `Please provide details of the government project or construction at ${location}, including project name, sanction details, and current status.`,
      `Please provide the budget allocation and expenditure details for this project.`,
      `Please provide details of the contractor(s) engaged for this project and their contract terms.`,
      `Please provide copies of inspection reports and progress reports for this project.`,
      `Please provide the names and designations of the officers overseeing this project.`,
    ],
    other: [
      `Please provide all records and information related to the issue at ${location} during ${duration}.`,
      `Please provide details of any complaints received regarding this issue and action taken.`,
      `Please provide details of the budget allocation and expenditure related to this issue.`,
      `Please provide the names and designations of the officers responsible for addressing this issue.`,
    ],
  };

  const coreRequests = categoryRequests[analysis.primaryCategory] || categoryRequests.other;
  coreRequests.forEach((text, i) => { requests.push({ id: `req_${i + 1}`, text, category: "core" }); });
  if (desired && desired.length > 10) requests.push({ id: "req_user", text: `Additionally, please provide information regarding: ${desired}`, category: "user_specified" });

  const categoryLabel = analysis.primaryCategory.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const title = `RTI Application - ${categoryLabel} Issue at ${location}`;
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return {
    title, date: dateStr,
    subject: `Request for Information regarding ${analysis.primaryCategory.replace(/_/g, " ")} at ${location}`,
    introduction: `Under the Right to Information Act, 2005, I wish to obtain the following information pertaining to ${analysis.primaryCategory.replace(/_/g, " ")} in the ${location} area. The issue has been ongoing for ${duration}. I request the following information to understand the current status and actions taken by the responsible authority.`,
    informationRequests: requests,
    preferredFormat: "Copies of the relevant documents and records in physical form / electronic form, as available.",
    applicantName: applicantName || "[Your Name]",
    applicantAddress: applicantAddress || "[Your Address]",
    applicantEmail: "[Your Email]",
    applicantPhone: "[Your Phone Number]",
    closingStatement: `I am a citizen of India making this application under Section 6 of the Right to Information Act, 2005. The information is requested in the public interest. As per the Act, please provide the information within 30 days of receipt of this application.\n\nIf the information pertains to a third party, please provide the same in accordance with Section 6(6) of the RTI Act.\n\nI am willing to pay the required application fee. Please intimate me if any additional fee is required for processing this application.`,
  };
}

export async function regenerateSection(section: string, draft: RTIDraft, analysis: ProblemAnalysis): Promise<string> {
  await new Promise((r) => setTimeout(r, 1000 + Math.random() * 500));
  const modifications: Record<string, string> = {
    introduction: `I, a citizen of India, respectfully submit this application under the Right to Information Act, 2005 (Section 6), seeking information regarding ${analysis.primaryCategory.replace(/_/g, " ")} in the affected area. This matter requires attention and I seek the following information to understand the actions taken and planned by the responsible authority.`,
  };
  return modifications[section] || (draft[section as keyof RTIDraft] as string) || "";
}

export async function analyzeResponse(_responseText: string, originalRequests: string[]): Promise<{ answered: string[]; partiallyAnswered: string[]; notAnswered: string[]; documentsReceived: string[]; keyDates: string[]; keyFigures: string[]; inconsistencies: string[] }> {
  await new Promise((r) => setTimeout(r, 2000));
  return {
    answered: ["Information partially provided"],
    partiallyAnswered: ["Some records referenced but not enclosed"],
    notAnswered: originalRequests.slice(0, 3),
    documentsReceived: [], keyDates: [], keyFigures: [], inconsistencies: [],
  };
}
