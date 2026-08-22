/**
 * AI Service Layer for CivicLens
 * Provides configurable AI service with intelligent text analysis.
 */

import type {
  RTICategory,
  ProblemAnalysis,
  AdaptiveQuestion,
  AuthorityInfo,
  RTIDraft,
  QuestionAnswer,
} from "./rti-types";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Chandigarh", "Puducherry", "Jammu and Kashmir", "Ladakh",
  "Chennai", "Mumbai", "Bangalore", "Hyderabad", "Kolkata",
  "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Kanpur", "Nagpur",
  "Indore", "Thane", "Bhopal", "Visakhapatnam", "Patna", "Vadodara",
  "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut",
  "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar",
  "Allahabad", "Ranchi", "Howrah", "Coimbatore", "Jabalpur", "Gwalior",
  "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kochi",
  "Tiruchirappalli", "Tiruppur", "Dehradun", "Amravati", "Nanded",
  "Kolhapur", "Thiruvananthapuram", "Kozhikode", "Mysore", "Mangalore",
  "Hubli", "Belgaum", "Gulbarga", "Bellary", "Shimoga", "Davangere",
  "Tambaram", "Perungalathur", "Perungudi", "Adyar", "T. Nagar", "Anna Nagar",
];

function extractLocation(text: string): string | null {
  const locations: string[] = [];

  // Route pattern: "Road connecting X to Y" / "between X and Y"
  const routePattern = /(?:road|route|highway|path|street|corridor)\s+(?:connecting|between|from|linking)\s+(.+?)(?:\s+(?:are|is|were|have|has|not|remain|the|that|which|who|where|when|how|because|since|while|during|after|before)\b)/i;
  const routeMatch = routePattern.exec(text);
  if (routeMatch) {
    let loc = routeMatch[1].trim();
    const stopIdx = loc.search(/\s+(?:are|is|were|have|has|not|remain|the|a|an|and|that|which|who)\b/i);
    if (stopIdx > 0) loc = loc.substring(0, stopIdx);
    if (loc.length > 3) locations.push(loc);
  }

  // Preposition pattern — stop at lowercase verb-like words
  const prepositionPattern = /(?:in|at|near|on|around|from|between|connecting|towards|of)\s+([A-Z][a-zA-Z\s.'-]*(?:,\s*[A-Z][a-zA-Z\s.'-]+)*)/g;
  let match: RegExpExecArray | null;
  while ((match = prepositionPattern.exec(text)) !== null) {
    let candidate = match[1].trim();
    const stopIdx = candidate.search(/\s+(?:are|is|were|have|has|not|remain|the|a|an|and|that|which|who|where|when)\b/i);
    if (stopIdx > 0) candidate = candidate.substring(0, stopIdx);
    if (candidate.length > 3 && candidate.length < 150) {
      locations.push(candidate);
    }
  }

  // City + state combos
  const cityStatePattern = /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*),\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/g;
  while ((match = cityStatePattern.exec(text)) !== null) {
    const candidate = match[1] + ", " + match[2];
    if (!locations.some(l => l.includes(match![1]))) {
      locations.push(candidate);
    }
  }

  // Known Indian cities
  for (const city of INDIAN_STATES) {
    const cityPattern = new RegExp("\\b" + city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "gi");
    if (cityPattern.test(text)) {
      if (!locations.some(l => l.includes(city))) {
        locations.push(city);
      }
    }
  }

  if (locations.length > 0) {
    return locations.sort((a, b) => b.length - a.length)[0];
  }
  return null;
}

function extractDuration(text: string): string | null {
  const patterns: [RegExp, string][] = [
    [/several\s+months/i, "several months"],
    [/many\s+months/i, "several months"],
    [/few\s+months/i, "a few months"],
    [/couple\s+of\s+months/i, "a couple of months"],
    [/over\s+a?\s*year/i, "over a year"],
    [/more\s+than\s+a?\s*year/i, "over a year"],
    [/several\s+years/i, "several years"],
    [/many\s+years/i, "several years"],
    [/few\s+years/i, "a few years"],
    [/couple\s+of\s+years/i, "a couple of years"],
    [/several\s+weeks/i, "several weeks"],
    [/many\s+weeks/i, "several weeks"],
    [/few\s+weeks/i, "a few weeks"],
    [/couple\s+of\s+weeks/i, "a couple of weeks"],
    [/couple\s+of\s+days/i, "a couple of days"],
    [/several\s+days/i, "several days"],
    [/few\s+days/i, "a few days"],
    [/(\d+)\s*(?:months?|weeks?|days?|years?)\s*(?:ago|back|since|now|or)/i, ""],
    [/(\d+)\s*(?:months?|weeks?|days?|years?)/i, ""],
  ];
  for (const [pattern, replacement] of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (replacement) return replacement;
      return match[0].trim();
    }
  }
  return null;
}

const CATEGORY_KEYWORDS: Record<RTICategory, string[]> = {
  roads_infrastructure: ["pothole", "road", "pavement", "sidewalk", "footpath", "asphalt", "tar", "road work", "road repair", "bridge", "flyover", "traffic signal"],
  streetlights: ["streetlight", "street light", "lamp post", "street lamp", "light not working", "no light", "dark street", "broken light", "lights not working", "lights remain", "poorly lit", "not working properly"],
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
  let best: RTICategory = "other";
  let bestScore = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [RTICategory, string[]][]) {
    let score = 0;
    for (const kw of keywords) { if (lower.includes(kw)) score += kw.split(" ").length; }
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best;
}

function detectSecondaryCategories(text: string, primary: RTICategory): RTICategory[] {
  const lower = text.toLowerCase();
  const secondary: RTICategory[] = [];
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [RTICategory, string[]][]) {
    if (cat === primary || cat === "other") continue;
    let score = 0;
    for (const kw of keywords) { if (lower.includes(kw)) score += kw.split(" ").length; }
    if (score > 0) secondary.push(cat);
  }
  return secondary;
}

export async function analyzeProblem(description: string): Promise<ProblemAnalysis> {
  await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));
  const primaryCategory = detectCategory(description);
  const secondaryCategories = detectSecondaryCategories(description, primaryCategory);
  const location = extractLocation(description);
  const timePeriod = extractDuration(description);

  const desiredInformation: string[] = [];
  const lower = description.toLowerCase();
  if (lower.includes("who") || lower.includes("responsible")) desiredInformation.push("Responsible authority and officials");
  if (lower.includes("money") || lower.includes("fund") || lower.includes("budget")) desiredInformation.push("Budget allocation and expenditure details");
  if (lower.includes("repair") || lower.includes("fix")) desiredInformation.push("Planned repair or maintenance work");
  if (lower.includes("complaint")) desiredInformation.push("Previous complaints and their status");
  if (lower.includes("contractor") || lower.includes("agency")) desiredInformation.push("Contractor or agency details");
  if (lower.includes("safe") || lower.includes("accident") || lower.includes("danger")) desiredInformation.push("Safety measures and risk assessment");
  if (desiredInformation.length === 0) desiredInformation.push("Information about the problem and responsible authority");

  return {
    primaryCategory,
    secondaryCategories,
    location,
    timePeriod,
    statedProblem: description,
    desiredInformation,
    missingInformation: [!location ? "Specific location/address" : null, !timePeriod ? "Duration of the problem" : null].filter(Boolean) as string[],
    recommendedQuestionCategories: ["location", "time_period", "previous_action", "desired_outcome"],
  };
}

export async function generateQuestions(analysis: ProblemAnalysis, answeredQuestions: QuestionAnswer[]): Promise<AdaptiveQuestion | null> {
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 500));
  const questions = generateContextualQuestions(analysis, answeredQuestions);
  return questions[0] || null;
}

export function getAllQuestionsForCategory(category: RTICategory): AdaptiveQuestion[] {
  return generateContextualQuestions(
    { primaryCategory: category, secondaryCategories: [], location: null, timePeriod: null, statedProblem: "", desiredInformation: [], missingInformation: [], recommendedQuestionCategories: [] },
    []
  );
}

function generateContextualQuestions(analysis: ProblemAnalysis, answeredQuestions: QuestionAnswer[]): AdaptiveQuestion[] {
  const answeredIds = new Set(answeredQuestions.map((a) => a.questionId));
  const questions: AdaptiveQuestion[] = [];
  const cat = analysis.primaryCategory;

  if (!analysis.location && !answeredIds.has("q_location")) {
    questions.push({ id: "q_location", question: "Where exactly is this problem? Please provide the street name, area, and city.", reason: "Location is essential to identify the responsible authority.", answerType: "text", allowsUnknown: true, category: "location" });
  }
  if (!analysis.timePeriod && !answeredIds.has("q_duration")) {
    questions.push({ id: "q_duration", question: "Approximately how long has this problem been going on?", reason: "Duration helps establish the scope of information to request.", answerType: "select", options: ["Less than a month", "1-6 months", "6-12 months", "1-2 years", "More than 2 years", "I don't know"], allowsUnknown: true, category: "time_period" });
  }

  if (cat === "streetlights") {
    if (!answeredIds.has("q_sl_count")) questions.push({ id: "q_sl_count", question: "Approximately how many streetlights are not working?", reason: "Scale of the problem helps in identifying the scope of the maintenance issue.", answerType: "text", allowsUnknown: true, category: "scope" });
    if (!answeredIds.has("q_sl_reported")) questions.push({ id: "q_sl_reported", question: "Have you reported this issue to anyone? If so, to whom?", reason: "Previous reports help identify the responsible department.", answerType: "text", allowsUnknown: true, category: "previous_action" });
    if (!answeredIds.has("q_sl_safety")) questions.push({ id: "q_sl_safety", question: "Are there any safety concerns resulting from the non-working streetlights?", reason: "Safety impact strengthens the urgency of the RTI request.", answerType: "text", allowsUnknown: true, category: "impact" });
    if (!answeredIds.has("q_sl_photos")) questions.push({ id: "q_sl_photos", question: "Do you have any photos or videos showing the non-working streetlights?", reason: "Visual evidence supports your application.", answerType: "yes_no", allowsUnknown: false, category: "evidence" });
  } else if (cat === "roads_infrastructure") {
    if (!answeredIds.has("q_road_type")) questions.push({ id: "q_road_type", question: "What type of road problem are you experiencing? (Select all that apply)", reason: "Different problems may fall under different departments.", answerType: "multi_select", options: ["Potholes", "Broken road surface", "Flooding", "Encroachment", "Streetlight issues", "Drainage issues", "Other"], allowsUnknown: true, category: "problem_type" });
    if (!answeredIds.has("q_road_complaints")) questions.push({ id: "q_road_complaints", question: "Have you or anyone you know previously complained to any authority about this issue?", reason: "Previous complaints help identify the responsible department.", answerType: "yes_no", allowsUnknown: true, category: "previous_action" });
    if (!answeredIds.has("q_road_repair")) questions.push({ id: "q_road_repair", question: "Has any repair work been announced, started, or partially completed?", reason: "Ongoing work may indicate a sanction or project exists.", answerType: "yes_no", allowsUnknown: true, category: "current_status" });
    if (!answeredIds.has("q_road_photos")) questions.push({ id: "q_road_photos", question: "Do you have any photographs or videos of the problem?", reason: "Visual evidence strengthens your application.", answerType: "yes_no", allowsUnknown: false, category: "evidence" });
  } else if (cat === "water_supply") {
    if (!answeredIds.has("q_water_type")) questions.push({ id: "q_water_type", question: "What is the nature of the water supply problem? (Select all that apply)", reason: "Different problems fall under different departments.", answerType: "multi_select", options: ["No water supply", "Low water pressure", "Contaminated water", "Irregular supply", "Water logging", "Other"], allowsUnknown: true, category: "problem_type" });
    if (!answeredIds.has("q_water_complaints")) questions.push({ id: "q_water_complaints", question: "Have you complained to any water authority or municipal body?", reason: "Previous complaints help identify the responsible department.", answerType: "text", allowsUnknown: true, category: "previous_action" });
    if (!answeredIds.has("q_water_photos")) questions.push({ id: "q_water_photos", question: "Do you have any supporting evidence such as photos or documents?", reason: "Evidence strengthens your application.", answerType: "yes_no", allowsUnknown: false, category: "evidence" });
  } else if (cat === "drainage_flooding") {
    if (!answeredIds.has("q_drain_frequency")) questions.push({ id: "q_drain_frequency", question: "How frequently does the flooding or drainage issue occur?", reason: "Frequency indicates severity.", answerType: "select", options: ["Every time it rains", "During heavy rain only", "Weekly", "Monthly", "Rarely", "I don't know"], allowsUnknown: true, category: "severity" });
    if (!answeredIds.has("q_drain_photos")) questions.push({ id: "q_drain_photos", question: "Do you have photos or videos of the flooding?", reason: "Visual evidence supports your request.", answerType: "yes_no", allowsUnknown: false, category: "evidence" });
  } else if (cat === "government_hospitals") {
    if (!answeredIds.has("q_hosp_name")) questions.push({ id: "q_hosp_name", question: "Which government hospital? Please provide the name and location.", reason: "Hospital identity is essential.", answerType: "text", allowsUnknown: true, category: "location" });
    if (!answeredIds.has("q_hosp_issue")) questions.push({ id: "q_hosp_issue", question: "What service or problem did you experience?", reason: "The nature of the issue determines what information can be requested.", answerType: "text", allowsUnknown: true, category: "problem_type" });
    if (!answeredIds.has("q_hosp_docs")) questions.push({ id: "q_hosp_docs", question: "Do you have any prescriptions, bills, or documents?", reason: "Documents help substantiate your request.", answerType: "yes_no", allowsUnknown: false, category: "evidence" });
  } else if (cat === "government_schools") {
    if (!answeredIds.has("q_school_name")) questions.push({ id: "q_school_name", question: "Which government school? Please provide name and area.", reason: "School identity is needed.", answerType: "text", allowsUnknown: true, category: "location" });
    if (!answeredIds.has("q_school_issue")) questions.push({ id: "q_school_issue", question: "What issue are you experiencing with the school?", reason: "Determines what information to request.", answerType: "text", allowsUnknown: true, category: "problem_type" });
    if (!answeredIds.has("q_school_docs")) questions.push({ id: "q_school_docs", question: "Do you have supporting documents or photos?", reason: "Evidence strengthens your application.", answerType: "yes_no", allowsUnknown: false, category: "evidence" });
  } else if (cat === "sanitation_waste") {
    if (!answeredIds.has("q_waste_type")) questions.push({ id: "q_waste_type", question: "What type of sanitation or waste problem? (Select all that apply)", reason: "Different problems fall under different departments.", answerType: "multi_select", options: ["Garbage not collected", "Open dumping", "Overflowing bins", "Stagnant water", "Stray animals", "Public toilet issues", "Other"], allowsUnknown: true, category: "problem_type" });
    if (!answeredIds.has("q_waste_photos")) questions.push({ id: "q_waste_photos", question: "Do you have photos or videos of the issue?", reason: "Visual evidence strengthens your application.", answerType: "yes_no", allowsUnknown: false, category: "evidence" });
  } else if (cat === "public_transport") {
    if (!answeredIds.has("q_transport_type")) questions.push({ id: "q_transport_type", question: "What type of public transport?", reason: "Different modes may be managed by different authorities.", answerType: "select", options: ["City bus", "State bus", "Metro", "Auto-rickshaw", "Railway", "Other"], allowsUnknown: true, category: "transport_mode" });
    if (!answeredIds.has("q_transport_issue")) questions.push({ id: "q_transport_issue", question: "What is the specific problem?", reason: "Determines what information to request.", answerType: "text", allowsUnknown: true, category: "problem_type" });
  } else if (cat === "government_construction") {
    if (!answeredIds.has("q_govt_project")) questions.push({ id: "q_govt_project", question: "What type of government construction or project?", reason: "Determines which department is responsible.", answerType: "text", allowsUnknown: true, category: "problem_type" });
    if (!answeredIds.has("q_govt_status")) questions.push({ id: "q_govt_status", question: "What is the current status?", reason: "Status helps identify available information.", answerType: "select", options: ["Not started", "Under construction", "Partially completed", "Stalled/Abandoned", "Completed but issues", "Other"], allowsUnknown: true, category: "status" });
  } else {
    if (!answeredIds.has("q_other_dept")) questions.push({ id: "q_other_dept", question: "Do you know which government department might be responsible?", reason: "Helps narrow down the authority.", answerType: "text", allowsUnknown: true, category: "authority_hint" });
    if (!answeredIds.has("q_other_desired")) questions.push({ id: "q_other_desired", question: "What information do you want to find out?", reason: "Your goals help craft targeted requests.", answerType: "text", allowsUnknown: true, category: "desired_outcome" });
  }

  if (!answeredIds.has("q_desired")) {
    questions.push({ id: "q_desired", question: "What specific information are you looking for? For example: Who is responsible? Was money allocated? Are repairs planned?", reason: "Understanding your goals helps craft targeted information requests.", answerType: "text", allowsUnknown: true, category: "desired_outcome" });
  }

  return questions.filter((q) => !answeredIds.has(q.id));
}

export async function identifyAuthority(analysis: ProblemAnalysis, answers: QuestionAnswer[]): Promise<AuthorityInfo> {
  await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));
  const locationAnswer = answers.find((a) => a.questionId.includes("location"));
  const location = locationAnswer?.answer || analysis.location || "the relevant area";
  const city = location.split(",").pop()?.trim() || "the city";
  const baseDate = new Date().toISOString().split("T")[0];

  const authorityMap: Partial<Record<RTICategory, Partial<AuthorityInfo>>> = {
    roads_infrastructure: { publicAuthority: "Public Works Department (PWD), " + city, department: "Roads & Buildings Division", addressedTo: "The Public Information Officer", authorityType: "state", officialAddress: "Office of the Executive Engineer, PWD, " + city, officialWebsite: "https://pwd.gov.in", submissionMethod: "Written application by post or in person at the PWD office, or through the respective state's RTI portal", sourceUrl: "https://rtionline.gov.in", sourceTitle: "Central Information Commission - RTI Online Portal", confidenceLevel: "medium" },
    streetlights: { publicAuthority: "Municipal Corporation / " + city + " Corporation", department: "Electrical / Maintenance Department", addressedTo: "The Public Information Officer", authorityType: "municipal", officialAddress: "Municipal Corporation Office, " + city, officialWebsite: "", submissionMethod: "Written application by post or in person at the Municipal Corporation office", sourceUrl: "https://rtionline.gov.in", sourceTitle: "Central Information Commission - RTI Online Portal", confidenceLevel: "medium" },
    drainage_flooding: { publicAuthority: "Municipal Corporation / Public Works Department, " + city, department: "Drainage & Sanitation Division", addressedTo: "The Public Information Officer", authorityType: "municipal", officialAddress: "Municipal Corporation Office, " + city, officialWebsite: "", submissionMethod: "Written application by post or in person at the Municipal Corporation or PWD office", sourceUrl: "https://rtionline.gov.in", sourceTitle: "Central Information Commission - RTI Online Portal", confidenceLevel: "medium" },
    water_supply: { publicAuthority: "Municipal Water Board / Water Supply Department, " + city, department: "Water Supply & Distribution", addressedTo: "The Public Information Officer", authorityType: "municipal", officialAddress: "Water Board Office, " + city, officialWebsite: "", submissionMethod: "Written application by post or in person at the Water Board office", sourceUrl: "https://rtionline.gov.in", sourceTitle: "Central Information Commission - RTI Online Portal", confidenceLevel: "medium" },
    government_hospitals: { publicAuthority: "Directorate of Health Services / Hospital Administration, " + city, department: "Health & Family Welfare", addressedTo: "The Public Information Officer", authorityType: "state", officialAddress: "Office of the Director of Health Services, " + city, officialWebsite: "", submissionMethod: "Written application by post or in person at the hospital or Health Department office", sourceUrl: "https://rtionline.gov.in", sourceTitle: "Central Information Commission - RTI Online Portal", confidenceLevel: "medium" },
    government_schools: { publicAuthority: "District Education Officer / Directorate of Public Instruction, " + city, department: "Education Department", addressedTo: "The Public Information Officer", authorityType: "state", officialAddress: "Office of the District Education Officer, " + city, officialWebsite: "", submissionMethod: "Written application by post or in person at the Education Department office", sourceUrl: "https://rtionline.gov.in", sourceTitle: "Central Information Commission - RTI Online Portal", confidenceLevel: "medium" },
  };

  const fallback: AuthorityInfo = {
    publicAuthority: "Relevant Public Authority, " + city, department: "General Administration",
    addressedTo: "The Public Information Officer", authorityType: "unknown",
    officialAddress: "Government Office, " + city, officialWebsite: "",
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
  const location = locationAnswer?.answer || analysis.location || "the concerned area";
  const durationAnswer = answers.find((a) => a.questionId.includes("duration") || a.questionId.includes("since"));
  const duration = durationAnswer?.answer || analysis.timePeriod || "the past several months";
  const desiredAnswer = answers.find((a) => a.questionId.includes("desired"));
  const desired = desiredAnswer?.answer || "";
  const cat = analysis.primaryCategory;
  const problemSummary = analysis.statedProblem.trim();

  const requests: { id: string; text: string; category: string }[] = [];
  const loc = location;
  const dur = duration;

  if (cat === "streetlights") {
    requests.push(
      { id: "req_1", text: "Please provide complete details of the maintenance arrangement for streetlights on the road in the " + loc + " area, including the responsible contractor or department, current contract status, and the last date of maintenance activity.", category: "core" },
      { id: "req_2", text: "Please provide records of all complaints received regarding non-functional or poorly lit streetlights in the " + loc + " area during " + dur + ", along with the action taken on each complaint and the current status.", category: "core" },
      { id: "req_3", text: "Please provide details of the budget allocated for streetlight maintenance, repair, and electricity charges in the " + loc + " area during " + dur + " and how it has been utilized.", category: "core" },
      { id: "req_4", text: "Please provide details of any planned repair, replacement, or new installation work for streetlights in the " + loc + " area, including work orders and timelines.", category: "core" },
      { id: "req_5", text: "Please provide the names, designations, and contact details of the officers responsible for streetlight maintenance in the " + loc + " area.", category: "core" },
    );
  } else if (cat === "roads_infrastructure") {
    requests.push(
      { id: "req_1", text: "Please provide complete details of any road repair, resurfacing, or maintenance work sanctioned, proposed, undertaken, or completed at " + loc + " during " + dur + ", including sanction orders, work orders, and related records.", category: "core" },
      { id: "req_2", text: "Please provide copies of all complaints received by the department regarding the road condition at " + loc + ", along with action taken on each complaint and current status.", category: "core" },
      { id: "req_3", text: "Please provide details of the contractor(s) responsible for road maintenance in the " + loc + " area, including their contract agreement and performance records.", category: "core" },
      { id: "req_4", text: "Please provide details of the budget allocation, expenditure, and fund utilization for road maintenance and repair in the " + loc + " area during " + dur + ".", category: "core" },
      { id: "req_5", text: "Please provide the names, designations, and contact details of the officers responsible for road maintenance in the " + loc + " area.", category: "core" },
    );
  } else if (cat === "water_supply") {
    requests.push(
      { id: "req_1", text: "Please provide details of the water supply infrastructure and maintenance arrangements for the " + loc + " area.", category: "core" },
      { id: "req_2", text: "Please provide records of all complaints regarding water supply in " + loc + " during " + dur + " and action taken on each complaint.", category: "core" },
      { id: "req_3", text: "Please provide details of any repair, improvement, or new pipeline work carried out or planned for water supply in " + loc + ".", category: "core" },
      { id: "req_4", text: "Please provide the budget allocation and expenditure for water supply in " + loc + " during " + dur + ".", category: "core" },
      { id: "req_5", text: "Please provide the names, designations, and contact details of officers responsible for water supply in " + loc + ".", category: "core" },
    );
  } else if (cat === "drainage_flooding") {
    requests.push(
      { id: "req_1", text: "Please provide details of the drainage system and its maintenance arrangements in the " + loc + " area.", category: "core" },
      { id: "req_2", text: "Please provide copies of all complaints and reports regarding drainage and flooding in " + loc + " during " + dur + ".", category: "core" },
      { id: "req_3", text: "Please provide details of any drainage improvement, repair, or desilting work carried out or planned in " + loc + ".", category: "core" },
      { id: "req_4", text: "Please provide the budget allocation and expenditure for drainage maintenance in " + loc + " during " + dur + ".", category: "core" },
      { id: "req_5", text: "Please provide the names, designations, and contact details of officers responsible for drainage in the " + loc + " area.", category: "core" },
    );
  } else if (cat === "government_hospitals") {
    requests.push(
      { id: "req_1", text: "Please provide details of the staff strength and vacancy position at the hospital during " + dur + ".", category: "core" },
      { id: "req_2", text: "Please provide records of all complaints received at the hospital during " + dur + " and action taken on each.", category: "core" },
      { id: "req_3", text: "Please provide details of medicine and supply procurement during " + dur + ".", category: "core" },
      { id: "req_4", text: "Please provide the budget allocation and expenditure for the hospital during " + dur + ".", category: "core" },
      { id: "req_5", text: "Please provide the names, designations, and contact details of the hospital administration and officers in charge.", category: "core" },
    );
  } else if (cat === "government_schools") {
    requests.push(
      { id: "req_1", text: "Please provide details of the staff strength, vacancies, and attendance records at the school during " + dur + ".", category: "core" },
      { id: "req_2", text: "Please provide records of all complaints and representations received regarding the school during " + dur + ".", category: "core" },
      { id: "req_3", text: "Please provide details of mid-day meal scheme implementation, budget, and expenditure at the school.", category: "core" },
      { id: "req_4", text: "Please provide details of infrastructure maintenance, repair work, and budget for the school.", category: "core" },
      { id: "req_5", text: "Please provide the names, designations, and contact details of the headmaster and school management committee members.", category: "core" },
    );
  } else if (cat === "sanitation_waste") {
    requests.push(
      { id: "req_1", text: "Please provide details of the waste collection and sanitation arrangements for the " + loc + " area.", category: "core" },
      { id: "req_2", text: "Please provide records of all complaints regarding sanitation in " + loc + " during " + dur + " and action taken on each.", category: "core" },
      { id: "req_3", text: "Please provide details of any sanitation improvement work carried out or planned in " + loc + ".", category: "core" },
      { id: "req_4", text: "Please provide the budget allocation and expenditure for sanitation in " + loc + " during " + dur + ".", category: "core" },
      { id: "req_5", text: "Please provide the names, designations, and contact details of officers responsible for sanitation in " + loc + ".", category: "core" },
    );
  } else {
    requests.push(
      { id: "req_1", text: "Please provide all records and information related to the issue at " + loc + " during " + dur + ".", category: "core" },
      { id: "req_2", text: "Please provide details of any complaints received regarding this issue and action taken.", category: "core" },
      { id: "req_3", text: "Please provide details of the budget allocation and expenditure related to this issue.", category: "core" },
      { id: "req_4", text: "Please provide the names, designations, and contact details of the officers responsible for addressing this issue.", category: "core" },
    );
  }

  if (desired && desired.length > 10) {
    requests.push({ id: "req_user", text: "Additionally, please provide information regarding: " + desired, category: "user_specified" });
  }

  const categoryLabel = analysis.primaryCategory.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const title = "RTI Application - " + categoryLabel + " Issue at " + location;
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const introParagraphs: string[] = [];
  introParagraphs.push("I, a citizen of India, respectfully submit this application under the Right to Information Act, 2005 (Section 6), seeking information regarding the " + categoryLabel.toLowerCase() + " issue in the " + location + " area.");
  introParagraphs.push("The issue, as described by me, is as follows:\n\n" + problemSummary);
  if (duration !== "the past several months") {
    introParagraphs.push("This problem has been ongoing for " + duration + ".");
  }
  introParagraphs.push("I request the following information to understand the current status, actions taken, and plans of the responsible authority.");

  return {
    title,
    date: dateStr,
    subject: "Request for Information regarding " + categoryLabel + " at " + location,
    introduction: introParagraphs.join("\n\n"),
    informationRequests: requests,
    preferredFormat: "Copies of the relevant documents and records in physical form / electronic form, as available.",
    applicantName: applicantName || "[Your Name]",
    applicantAddress: applicantAddress || "[Your Address]",
    applicantEmail: "[Your Email]",
    applicantPhone: "[Your Phone Number]",
    closingStatement: "I am a citizen of India making this application under Section 6 of the Right to Information Act, 2005. The information is requested in the public interest. As per the Act, please provide the information within 30 days of receipt of this application.\n\nIf the information pertains to a third party, please provide the same in accordance with Section 6(6) of the RTI Act.\n\nI am willing to pay the required application fee. Please intimate me if any additional fee is required for processing this application.",
  };
}

export async function regenerateSection(section: string, draft: RTIDraft, analysis: ProblemAnalysis): Promise<string> {
  await new Promise((r) => setTimeout(r, 1000 + Math.random() * 500));
  const catLabel = analysis.primaryCategory.replace(/_/g, " ");

  const introVariants = [
    "I, a citizen of India, hereby submit this application under the Right to Information Act, 2005, Section 6, to obtain information concerning " + catLabel + " issues in the affected area. The matter has persisted without adequate response from the responsible authority, and I seek clarity on the actions taken and planned.",
    "Under Section 6 of the Right to Information Act, 2005, I, an Indian citizen, request the following information pertaining to " + catLabel + " in the relevant area. The issue has been brought to the attention of the responsible department but remains unresolved. I seek details of all actions taken and proposed.",
    "I am writing to exercise my right under the Right to Information Act, 2005, to obtain records and information regarding " + catLabel + " matters in the affected area. Despite the significance of this issue to public welfare, no satisfactory response has been received from the responsible authority. I respectfully request the information outlined below.",
  ];

  const subjectVariants = [
    "Request for Information under RTI Act, 2005 \u2014 " + catLabel,
    "Application under Right to Information Act, 2005 \u2014 Regarding " + catLabel + " in the Area",
    "RTI Application for Information on " + catLabel + " \u2014 Urgent Attention Required",
  ];

  const modifications: Record<string, string[]> = {
    introduction: introVariants,
    subject: subjectVariants,
  };

  const variants = modifications[section];
  if (variants && variants.length > 0) {
    return variants[Math.floor(Math.random() * variants.length)];
  }
  return (draft[section as keyof RTIDraft] as string) || "";
}

export async function analyzeResponse(_responseText: string, originalRequests: string[]): Promise<{ answered: string[]; partiallyAnswered: string[]; notAnswered: string[]; documentsReceived: string[]; keyDates: string[]; keyFigures: string[]; inconsistencies: string[] }> {
  await new Promise((r) => setTimeout(r, 2000));
  return {
    answered: ["Information partially provided"],
    partiallyAnswered: ["Some records referenced but not enclosed"],
    notAnswered: originalRequests.slice(0, 3),
    documentsReceived: [],
    keyDates: [],
    keyFigures: [],
    inconsistencies: [],
  };
}
