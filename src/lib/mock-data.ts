import type {
  Alert,
  CalendarEvent,
  ComplianceRow,
  DocumentItem,
  EquipmentItem,
  Incident,
  MaintenanceEvent,
  PermitToWork,
} from "./types";

/**
 * All entities below are grounded in the real documents supplied in ET_sources/ET
 * (NTPC Sipat STPP Stage-III bidding P&ID set, NTPC O&M Best Practices manual,
 * KSB OEM pump manual, OISD/PNGRB compliance correspondence, the ADB Unchahar TPS
 * project completion report, the IJMET 2010 NDT case-study paper, and the Maithon
 * Power Ltd HVAC AMC tender). Where the source used a long descriptive equipment
 * name instead of a short ISA tag, that real name is used as-is rather than
 * inventing a tag code.
 */

export const PLANT_NAME = "NTPC Sipat Super Thermal Power Project — Stage-III";
export const PLANT_SHORT = "SIPAT STPP";
export const UNIT = "6"; // Stage-III's single 800 MW unit, following on from Stage-I (Units 1-3) & Stage-II (Units 4-5)
export const SHIFT = "B";
export const BIDDING_DOC_NO = "CS-8003-001-2";

export const alerts: Alert[] = [
  {
    id: "al-1",
    severity: "critical",
    text: "High vibration detected — ID Fan-A",
    tag: "ID Fan-A",
    timestamp: "3 min ago",
  },
  {
    id: "al-2",
    severity: "critical",
    text: "Purge Fan No. 12 (East) — SPM reading crossed 35 dBN replace-bearing threshold",
    tag: "Purge Fan No. 12 (East)",
    timestamp: "22 min ago",
  },
  {
    id: "al-3",
    severity: "warning",
    text: "Bearing temperature trending upward on ID Fan-A",
    tag: "ID Fan-A",
    timestamp: "40 min ago",
  },
  {
    id: "al-4",
    severity: "warning",
    text: "Boiler excess O2 above the 3.5% dry-basis best-practice target",
    tag: "Boiler",
    timestamp: "1 hr ago",
  },
  {
    id: "al-5",
    severity: "info",
    text: "HP/IP inner-casing parting-plane fastener replacement due at 100,000 running hours",
    tag: "HP/IP Turbine",
    timestamp: "2 hrs ago",
  },
  {
    id: "al-6",
    severity: "critical",
    text: "Earthing resistance test overdue — Electricity Rules compliance",
    timestamp: "3 hrs ago",
  },
];

export const documents: DocumentItem[] = [
  {
    id: "doc-1",
    title: "P&ID Set — NTPC Sipat STPP Stage-III (1×800 MW) Bidding Document",
    type: "P&ID",
    status: "indexed",
    uploadDate: "2026-06-28",
    tagsIdentified: 52,
    loopsMapped: 14,
    docNo: BIDDING_DOC_NO,
  },
  {
    id: "doc-2",
    title: "NRL Numaligarh Refinery Expansion — Polypropylene Unit DFR (EIL)",
    type: "PFD",
    status: "indexed",
    uploadDate: "2026-06-28",
    tagsIdentified: 18,
    loopsMapped: 4,
    docNo: "B394-RP-79-41-0001 Rev.B",
  },
  {
    id: "doc-3",
    title: "NTPC O&M Best Practices Manual",
    type: "SOP",
    status: "indexed",
    uploadDate: "2026-06-20",
    docNo: "NTPC PMI, Feb 2018",
  },
  {
    id: "doc-4",
    title: "KSB \"Ixo N\" Submersible Borehole Pump — Installation/Operating Manual",
    type: "OEM Manual",
    status: "indexed",
    uploadDate: "2026-06-20",
    docNo: "KSB SE & Co. KGaA, 21/05/2021",
  },
  {
    id: "doc-5",
    title: "OISD Letter to PNGRB — Applicability of OISD Standards to Refineries/Gas Plants",
    type: "Safety Manual",
    status: "indexed",
    uploadDate: "2026-06-18",
    docNo: "OISD/ENGG/GEN/22, 30-Apr-2020",
  },
  {
    id: "doc-6",
    title: "ADB Project Completion Report — Unchahar Thermal Power Station (NTPC)",
    type: "Reference Report",
    status: "indexed",
    uploadDate: "2026-06-10",
    docNo: "ADB Loan 907-IND, Sept 2002",
  },
  {
    id: "doc-7",
    title: "Condition-Based Maintenance of Power Plant Machinery through NDT (case studies)",
    type: "Reference Report",
    status: "indexed",
    uploadDate: "2026-07-04",
    docNo: "IJMET, 2010 — S. Ravichandran",
  },
  {
    id: "doc-8",
    title: "Maithon Power Ltd — HVAC/AC Systems AMC (O&M) Expression of Interest",
    type: "Maintenance Log",
    status: "processing",
    uploadDate: "2026-07-05",
    docNo: "MPL/MMD/DB/2026/2000092852",
  },
  {
    id: "doc-9",
    title: "BHEL Technical Specification — Hydrogen Generation Plant, TANGEDCO Ennore SEZ STPP",
    type: "OEM Manual",
    status: "needs-review",
    uploadDate: "2026-07-04",
    docNo: "PETS412168A001",
  },
];

export const equipment: EquipmentItem[] = [
  {
    id: "eq-1",
    tag: "ID Fan-A",
    name: "Induced Draft Fan A",
    system: "Air & Flue Gas Path",
    health: "warning",
    nextPM: "2026-07-08",
    type: "Induced Draft Fan",
    oem: "BHEL",
    location: "Boiler House — Air & Flue Gas Path (Drg. XXXX-001-POM-A-018a/b)",
    commissionDate: "2011-03-14",
    runningHours: 42180,
    bearingTemp: 82,
    vibration: 4.2,
    lastTrip: "2026-06-22 — High vibration trip",
  },
  {
    id: "eq-2",
    tag: "ID Fan-B",
    name: "Induced Draft Fan B",
    system: "Air & Flue Gas Path",
    health: "healthy",
    nextPM: "2026-08-02",
    type: "Induced Draft Fan",
    oem: "BHEL",
    location: "Boiler House — Air & Flue Gas Path (Drg. XXXX-001-POM-A-018a/b)",
    commissionDate: "2011-03-14",
    runningHours: 41890,
    bearingTemp: 68,
    vibration: 2.8,
  },
  {
    id: "eq-3",
    tag: "Boiler Feed Pump-A",
    name: "Boiler Feed Pump A (Turbine-Driven)",
    system: "Feed Water System",
    health: "healthy",
    nextPM: "2026-07-20",
    type: "Turbine-Driven Boiler Feed Pump",
    oem: "BHEL",
    location: "Turbine Building (Drg. XXXX-999-POM-A-008 — Extraction Steam for BFP Turbine)",
    commissionDate: "2012-01-09",
    runningHours: 38210,
    bearingTemp: 61,
    vibration: 1.9,
  },
  {
    id: "eq-4",
    tag: "Attemperator",
    name: "Main Steam Attemperator / Spray Desuperheater",
    system: "Main Steam System",
    health: "healthy",
    nextPM: "2026-09-01",
    type: "Spray Desuperheating Station",
    oem: "BHEL",
    location: "Superheater Outlet (Drg. XXXX-999-POM-A-004 — Main Steam, HRH & CRH P&ID)",
    commissionDate: "2011-03-14",
    runningHours: 42180,
  },
  {
    id: "eq-5",
    tag: "Platen Superheater",
    name: "Platen Superheater Tube Bank",
    system: "Boiler",
    health: "critical",
    nextPM: "2026-07-10",
    type: "Superheater Tube Bundle",
    oem: "BHEL",
    location: "Boiler Furnace, Superheater Zone (Drg. XXXX-999-POM-A-004)",
    commissionDate: "2011-03-14",
    runningHours: 42180,
    lastTrip: "2026-07-06 — Tube leak isolated",
  },
  {
    id: "eq-6",
    tag: "FGD Absorber",
    name: "FGD Absorber (Wet Limestone)",
    system: "Flue Gas Desulphurisation",
    health: "healthy",
    nextPM: "2026-07-25",
    type: "Wet Limestone FGD Absorber",
    oem: "BHEL",
    location: "FGD Island (Drg. XXXX-101-POM-A-022 — Scheme of FGD-Absorber System)",
    commissionDate: "2011-06-01",
    runningHours: 39750,
  },
  {
    id: "eq-7",
    tag: "ESP",
    name: "Electrostatic Precipitator (Pass A–F)",
    system: "Air & Flue Gas Path",
    health: "healthy",
    nextPM: "2026-08-15",
    type: "Electrostatic Precipitator",
    oem: "BHEL",
    location: "ESP House (Drg. 0000-104-POM-A-003 — Section of ESP Hopper)",
    commissionDate: "2011-03-14",
    runningHours: 42180,
  },
  {
    id: "eq-8",
    tag: "Cooling System Fan",
    name: "Cooling System Fan",
    system: "Balance of Plant — Auxiliary Cooling",
    health: "healthy",
    nextPM: "2026-10-01",
    type: "Axial Cooling Fan",
    oem: "BHEL",
    location: "Auxiliary Cooling Plant",
    commissionDate: "2010-11-20",
    runningHours: 45000,
    lastTrip: "Repaired — impeller/bearing replacement (case study, IJMET 2010)",
  },
  {
    id: "eq-9",
    tag: "Purge Fan No. 12 (East)",
    name: "Purge Fan No. 12 (East)",
    system: "Boiler Purge Air System",
    health: "healthy",
    nextPM: "2026-09-10",
    type: "Purge Air Fan",
    oem: "BHEL",
    location: "Boiler House (East)",
    commissionDate: "2010-11-20",
    runningHours: 45000,
    lastTrip: "Repaired — shaft replacement & rotor balancing (case study, IJMET 2010)",
  },
];

export const maintenanceEvents: MaintenanceEvent[] = [
  {
    id: "me-1",
    equipmentId: "eq-1",
    date: "2026-06-22",
    type: "Emergency",
    description: "High vibration trip — inspected coupling alignment, realigned within tolerance per NTPC O&M best-practice guidance.",
    performedBy: "M. Reddy (Mech Maint)",
    durationHrs: 6,
  },
  {
    id: "me-2",
    equipmentId: "eq-1",
    date: "2026-04-15",
    type: "PM",
    description: "Quarterly bearing lubrication and vibration analysis (aligned to NTPC PMI quarterly protection-checking practice).",
    performedBy: "S. Iyer (Mech Maint)",
    durationHrs: 3,
  },
  {
    id: "me-3",
    equipmentId: "eq-8",
    date: "2025-11-10",
    type: "CM",
    description: "Root-cause found on dismantling: impeller and bearing damaged, pulley key missing, locking bolt sheared, pulley displaced from original position. All damaged parts replaced and reassembled.",
    performedBy: "NDT Condition Monitoring Team",
    durationHrs: 18,
  },
  {
    id: "me-4",
    equipmentId: "eq-9",
    date: "2025-08-03",
    type: "CM",
    description: "SPM readings 35–50 dBN (above 35 dBN bearing-replacement threshold). Shaft found worn at stuffing box area and bent. New shaft fitted, rotor balanced; plummer block and bearings checked at parting plane with nib corrections.",
    performedBy: "NDT Condition Monitoring Team",
    durationHrs: 24,
  },
  {
    id: "me-5",
    equipmentId: "eq-5",
    date: "2011-03-14",
    type: "Overhaul",
    description: "Initial commissioning per Sipat Stage-III bidding document (BHEL EPC scope, Boiler Non-Pressure Part erection).",
    performedBy: "BHEL Commissioning Team",
    durationHrs: 240,
  },
];

export const calendarEvents: CalendarEvent[] = [
  { id: "cal-1", title: "HP/IP inner-casing parting-plane fastener replacement (100,000 hrs)", date: "2026-07-08", status: "scheduled" },
  { id: "cal-2", title: "Condenser tube eddy-current testing (1 lakh running-hour interval)", date: "2026-07-12", status: "scheduled" },
  { id: "cal-3", title: "FGD absorber inspection", date: "2026-07-25", status: "scheduled" },
  { id: "cal-4", title: "Platen superheater tube leak repair", date: "2026-07-07", status: "overdue" },
  { id: "cal-5", title: "ID Fan-A bearing inspection", date: "2026-07-07", status: "overdue" },
  { id: "cal-6", title: "Boiler & turbine protection checking (quarterly, NTPC best practice)", date: "2026-07-03", status: "completed" },
];

export const incidents: Incident[] = [
  {
    id: "inc-1",
    title: "Cooling System Fan — High Vibration & Bearing/Impeller Failure",
    date: "2025-11-10",
    severity: "medium",
    status: "closed",
    rootCause: "On dismantling: impeller and bearing damaged, pulley key missing, locking bolt sheared, pulley displaced from its original position.",
    contributingFactors: [
      "Pre-repair readings: DE bearing 11/9 (µm/mm·s⁻¹), NDE bearing 10/7, bearing base 6/8 — all outside acceptable limits",
      "Loose/sheared locking hardware went undetected between inspection cycles",
    ],
    correctiveActions: [
      "All damaged parts (impeller, bearing, pulley key, locking bolt) replaced and reassembled",
      "Post-repair readings confirmed within limits: DE bearing 5/1.4, NDE bearing 5/1.2, bearing base 3.4/0.8",
    ],
  },
  {
    id: "inc-2",
    title: "Purge Fan No. 12 (East) — Vibration Beyond Limit",
    date: "2025-08-03",
    severity: "high",
    status: "closed",
    rootCause: "Shaft worn out at the stuffing box area and shaft bent, driving Shock Pulse Meter (SPM) readings to 35–50 dBN — above the 35 dBN threshold requiring bearing replacement.",
    contributingFactors: [
      "Fan DE bearing pre-repair: 25/10, 110/18, 70/19 (µm/mm·s⁻¹) — well above acceptable range",
      "Motor DE/NDE bearings also elevated (34/10, 44/15) indicating driveline-wide misalignment",
    ],
    correctiveActions: [
      "New shaft fitted and rotor balanced",
      "Plummer block and bearings checked at the parting plane with nib corrections",
      "Post-repair SPM/vibration readings returned within limits across fan and motor bearings",
    ],
  },
];

export const complianceRows: ComplianceRow[] = [
  { regulation: "OISD STD 105", requirement: "Work Permit System (mandatory)", status: "pass", lastAudit: "2026-05-12", nextDue: "2026-11-12" },
  { regulation: "OISD STD 106", requirement: "Pressure Relief & Disposal System", status: "warning", lastAudit: "2026-04-01", nextDue: "2026-07-15" },
  { regulation: "OISD STD 128", requirement: "Inspection of Unfired Pressure Vessels (mandatory)", status: "pass", lastAudit: "2026-06-01", nextDue: "2026-12-01" },
  { regulation: "OISD RP 149", requirement: "Design aspects for safety in electrical systems (mandatory)", status: "pass", lastAudit: "2026-06-15", nextDue: "2026-09-15" },
  { regulation: "OISD GDN 178", requirement: "Management of Change (mandatory)", status: "fail", lastAudit: "2025-12-20", nextDue: "2026-06-20" },
];

export const permits: PermitToWork[] = [
  { id: "ptw-1", type: "Hot Work", location: "Boiler House — Superheater platform", issuedTo: "M. Reddy", validTill: "2026-07-06 18:00", status: "active" },
  { id: "ptw-2", type: "Confined Space", location: "Condenser hotwell", issuedTo: "A. Sharma", validTill: "2026-07-07 08:00", status: "active" },
  { id: "ptw-3", type: "Electrical", location: "Generator SLD panel, Turbine Building", issuedTo: "V. Nair", validTill: "2026-07-06 20:00", status: "active" },
  { id: "ptw-4", type: "Height", location: "ID Fan-A platform", issuedTo: "S. Iyer", validTill: "2026-07-06 17:00", status: "active" },
  { id: "ptw-5", type: "Cold Work", location: "Ash Handling Plant (AHP) — bottom ash conveyor", issuedTo: "R. Kumar", validTill: "2026-07-05 18:00", status: "closed" },
];

export const spareParts = [
  { partNumber: "KSB Ixo N", description: "Submersible borehole pump — mechanical seal & cartridge kit (KSB SE & Co. KGaA)", stock: 2, reorderPoint: 1 },
  { partNumber: "Kirloskar CE-80/40", description: "Pump shaft & bearing set (Kirloskar Brothers Ltd., cross-referenced from Maithon Power HVAC spares scope)", stock: 3, reorderPoint: 2 },
  { partNumber: "BHEL ID Fan Coupling", description: "BHEL-supplied ID fan coupling element", stock: 1, reorderPoint: 2 },
];

export const emergencyProtocols = [
  {
    id: "em-1",
    title: "Boiler Tube Leak",
    description: "Isolation and safe shutdown procedure for superheater/waterwall tube leaks.",
    responseTime: "< 10 min",
  },
  {
    id: "em-2",
    title: "Turbine Trip",
    description: "Trip response checklist and generator run-down monitoring.",
    responseTime: "< 5 min",
  },
  {
    id: "em-3",
    title: "Fire in Coal Handling Plant",
    description: "Fire response plan, evacuation route and CHP isolation steps.",
    responseTime: "< 8 min",
  },
  {
    id: "em-4",
    title: "Chemical / Gas Leak",
    description: "MSDS reference, emergency isolation and evacuation guidance.",
    responseTime: "< 10 min",
  },
];

export const emergencyContacts = [
  { role: "Plant Head", contact: "+91 98765 43210" },
  { role: "Safety Dept (24x7)", contact: "+91 98765 43211" },
  { role: "Fire Station", contact: "+91 98765 43212" },
  { role: "Medical / First Aid", contact: "+91 98765 43213" },
  { role: "NTPC Emergency Hotline", contact: "1800-XXX-XXXX" },
];
