import { defineMcp } from "@lovable.dev/mcp-js";
import searchPatients from "./tools/search-patients";
import getPatient from "./tools/get-patient";
import listPatientResources from "./tools/list-patient-resources";

export default defineMcp({
  name: "remix-of-patient-connect-hub",
  title: "Remix of Patient Connect Hub",
  version: "0.1.0",
  instructions:
    "Read-only access to the Nexus Pro synthetic FHIR demo data. Use `search_patients` to find a patient, `get_patient` for demographics, and `list_patient_resources` for observations, conditions, medications and other records.",
  tools: [searchPatients, getPatient, listPatientResources],
});
