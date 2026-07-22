// Draft persistence for the New Patient Intake Wizard.
// Stored in localStorage so users can safely leave and resume later.

export const DRAFT_KEY = "nexus-pro:intake-draft:v1";

export type GenderChoice = "Male" | "Female" | "Non-binary" | "Prefer not to say";

export interface AddressDraft {
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface EmergencyContactDraft {
  firstName: string;
  lastName: string;
  relationship: string;
  phone: string;
}

export interface OrgRef {
  id: string;
  name: string;
}

export interface PractitionerRef {
  id: string;
  name: string;
}

export interface InsuranceTierDraft {
  providerId: string; // Organization id
  providerName: string;
  policyNumber: string;
  expirationDate: string; // YYYY-MM-DD
  plan: string;
  copay: string; // numeric string
}

export interface PastConditionDraft {
  diagnosis: string;
  onset: string;
  clinicalStatus: "active" | "recurrence" | "relapse" | "inactive" | "remission" | "resolved";
  resolved: boolean;
}

export interface MedicationDraft {
  name: string;
  dosage: string;
  status: "active" | "completed" | "stopped" | "on-hold" | "intended" | "unknown";
}

export interface AllergyDraft {
  substance: string;
  reaction: string;
  severity: "mild" | "moderate" | "severe" | "";
  criticality: "low" | "high" | "unable-to-assess" | "";
}

export interface FamilyHistoryDraft {
  relationship: string;
  name: string;
  condition: string;
  note: string;
}

export interface IntakeDraft {
  step: number;
  // Step 1
  firstName: string;
  lastName: string;
  chosenName: string;
  birthDate: string;
  gender: GenderChoice | "";
  // Step 2
  phone: string;
  occupation: string;
  billingAddress: AddressDraft;
  currentAddress: AddressDraft;
  sameAsBilling: boolean;
  emergencyContact: EmergencyContactDraft;
  // Step 3
  preferredPharmacy: OrgRef | null;
  erxPharmacy: OrgRef | null;
  laboratoryCenter: OrgRef | null;
  radiologyCenter: OrgRef | null;
  serviceLocation: OrgRef | null;
  primaryCarePhysician: PractitionerRef | null;
  // Step 4
  primary: InsuranceTierDraft;
  secondary: InsuranceTierDraft;
  tertiary: InsuranceTierDraft;
  // Step 5
  chiefComplaint: string;
  hpi: string;
  pastConditions: PastConditionDraft[];
  medications: MedicationDraft[];
  allergies: AllergyDraft[];
  familyHistory: FamilyHistoryDraft[];
}

export const emptyAddress = (): AddressDraft => ({
  line1: "",
  line2: "",
  city: "",
  state: "",
  country: "United States",
  postalCode: "",
});

export const emptyInsurance = (): InsuranceTierDraft => ({
  providerId: "",
  providerName: "",
  policyNumber: "",
  expirationDate: "",
  plan: "",
  copay: "",
});

export const emptyDraft = (): IntakeDraft => ({
  step: 1,
  firstName: "",
  lastName: "",
  chosenName: "",
  birthDate: "",
  gender: "",
  phone: "",
  occupation: "",
  billingAddress: emptyAddress(),
  currentAddress: emptyAddress(),
  sameAsBilling: true,
  emergencyContact: { firstName: "", lastName: "", relationship: "", phone: "" },
  preferredPharmacy: null,
  erxPharmacy: null,
  laboratoryCenter: null,
  radiologyCenter: null,
  serviceLocation: null,
  primaryCarePhysician: null,
  primary: emptyInsurance(),
  secondary: emptyInsurance(),
  tertiary: emptyInsurance(),
  chiefComplaint: "",
  hpi: "",
  pastConditions: [],
  medications: [],
  allergies: [],
  familyHistory: [],
});

export function loadDraft(): IntakeDraft {
  if (typeof window === "undefined") return emptyDraft();
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return emptyDraft();
    return { ...emptyDraft(), ...JSON.parse(raw) };
  } catch {
    return emptyDraft();
  }
}

export function saveDraft(d: IntakeDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {
    /* ignore */
  }
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export const INSURANCE_PROVIDERS = [
  "UnitedHealthcare",
  "Anthem",
  "Aetna",
  "Cigna",
  "Humana",
  "Kaiser Permanente",
  "Centene",
  "Molina Healthcare",
  "Blue Cross Blue Shield",
  "Elevance Health",
  "Health Care Service Corporation",
  "Highmark",
  "Independence Blue Cross",
  "WellCare",
  "Oscar Health",
];

export const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "Mexico",
  "India",
];

export const STATES_BY_COUNTRY: Record<string, string[]> = {
  "United States": [
    "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
  ],
  Canada: ["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"],
  "United Kingdom": ["England","Scotland","Wales","Northern Ireland"],
  Australia: ["ACT","NSW","NT","QLD","SA","TAS","VIC","WA"],
  Germany: ["Bavaria","Berlin","Hamburg","Hesse","Saxony","Others"],
  France: ["Île-de-France","Provence-Alpes-Côte d'Azur","Auvergne-Rhône-Alpes","Others"],
  Mexico: ["Mexico City","Jalisco","Nuevo León","Others"],
  India: ["Delhi","Maharashtra","Karnataka","Tamil Nadu","Others"],
};

export const RELATIONSHIP_CODES: { code: string; display: string }[] = [
  { code: "SPS", display: "Spouse" },
  { code: "DOMPART", display: "Domestic partner" },
  { code: "PRN", display: "Parent" },
  { code: "CHILD", display: "Child" },
  { code: "SIB", display: "Sibling" },
  { code: "FRND", display: "Friend" },
  { code: "GUARD", display: "Guardian" },
  { code: "OTH", display: "Other" },
];

export const FAMILY_RELATIONSHIPS: { code: string; display: string }[] = [
  { code: "MTH", display: "Mother" },
  { code: "FTH", display: "Father" },
  { code: "BRO", display: "Brother" },
  { code: "SIS", display: "Sister" },
  { code: "SON", display: "Son" },
  { code: "DAU", display: "Daughter" },
  { code: "GRMTH", display: "Grandmother" },
  { code: "GRFTH", display: "Grandfather" },
  { code: "AUNT", display: "Aunt" },
  { code: "UNCLE", display: "Uncle" },
];

export function mapGender(g: GenderChoice | ""): "male" | "female" | "other" | "unknown" {
  if (g === "Male") return "male";
  if (g === "Female") return "female";
  if (g === "Non-binary" || g === "Prefer not to say") return "other";
  return "unknown";
}
