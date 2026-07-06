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

export const PLANT_NAME = "SIPAT Super Thermal Power Project";
export const PLANT_SHORT = "SIPAT STPP";
export const UNIT = "Unit 3";
export const SHIFT = "B";

export const alerts: Alert[] = [
  {
    id: "al-1",
    severity: "critical",
    text: "High vibration detected — ID Fan 3A",
    tag: "21-FN-301A",
    timestamp: "3 min ago",
  },
  {
    id: "al-2",
    severity: "critical",
    text: "Boiler tube leak isolated — Superheater section",
    tag: "21-BLR-003",
    timestamp: "22 min ago",
  },
  {
    id: "al-3",
    severity: "warning",
    text: "Bearing temperature trending upward",
    tag: "21-FN-301A",
    timestamp: "40 min ago",
  },
  {
    id: "al-4",
    severity: "warning",
    text: "Coal GCV dropped below 4,000 kcal/kg",
    tag: "CHP-COAL-01",
    timestamp: "1 hr ago",
  },
  {
    id: "al-5",
    severity: "info",
    text: "Scheduled valve testing due this week",
    tag: "21-PV-101A",
    timestamp: "2 hrs ago",
  },
  {
    id: "al-6",
    severity: "critical",
    text: "Overdue safety inspection — Turbine Hall",
    timestamp: "3 hrs ago",
  },
];

export const documents: DocumentItem[] = [
  {
    id: "doc-1",
    title: "SIPAT Unit 3 — Main Steam P&ID (Sheet 10 of 47)",
    type: "P&ID",
    status: "indexed",
    uploadDate: "2026-06-28",
    tagsIdentified: 47,
    loopsMapped: 12,
  },
  {
    id: "doc-2",
    title: "P&ID — Sheet 22: Centralized Nitrogen Filling System",
    type: "P&ID",
    status: "indexed",
    uploadDate: "2026-06-28",
    tagsIdentified: 31,
    loopsMapped: 6,
  },
  {
    id: "doc-3",
    title: "SOP-SIPAT-MS-003: Main Steam System Operation",
    type: "SOP",
    status: "indexed",
    uploadDate: "2026-06-20",
  },
  {
    id: "doc-4",
    title: "SOP-SIPAT-DF-001: ID Fan Start/Stop Procedure",
    type: "SOP",
    status: "indexed",
    uploadDate: "2026-06-20",
  },
  {
    id: "doc-5",
    title: "Equipment Tag Register — Main Steam Section",
    type: "Maintenance Log",
    status: "indexed",
    uploadDate: "2026-06-18",
  },
  {
    id: "doc-6",
    title: "NTPC Safety Rules — Boiler & Turbine Operations",
    type: "Safety Manual",
    status: "indexed",
    uploadDate: "2026-06-10",
  },
  {
    id: "doc-7",
    title: "BHEL OEM Manual — TLT-Babcock ID Fan",
    type: "OEM Manual",
    status: "processing",
    uploadDate: "2026-07-05",
  },
  {
    id: "doc-8",
    title: "Boiler Tube Leak — Inspection Report Q2 2026",
    type: "Inspection Report",
    status: "needs-review",
    uploadDate: "2026-07-04",
  },
];

export const equipment: EquipmentItem[] = [
  {
    id: "eq-1",
    tag: "21-FN-301A",
    name: "ID Fan 3A",
    system: "Draft System",
    health: "warning",
    nextPM: "2026-07-08",
    type: "Centrifugal Fan (Axial Inlet)",
    oem: "BHEL / TLT-Babcock",
    location: "Boiler House, Elevation +12.5m",
    commissionDate: "2011-03-14",
    runningHours: 42180,
    bearingTemp: 82,
    vibration: 4.2,
    lastTrip: "2026-06-22 — High vibration trip",
  },
  {
    id: "eq-2",
    tag: "21-FN-301B",
    name: "ID Fan 3B",
    system: "Draft System",
    health: "healthy",
    nextPM: "2026-08-02",
    type: "Centrifugal Fan (Axial Inlet)",
    oem: "BHEL / TLT-Babcock",
    location: "Boiler House, Elevation +12.5m",
    commissionDate: "2011-03-14",
    runningHours: 41890,
    bearingTemp: 68,
    vibration: 2.8,
  },
  {
    id: "eq-3",
    tag: "21-FW-201B",
    name: "Feed Water Pump 2B",
    system: "Feed Water System",
    health: "healthy",
    nextPM: "2026-07-20",
    type: "Multistage Centrifugal Pump",
    oem: "KSB",
    location: "Turbine Building, Ground Floor",
    commissionDate: "2012-01-09",
    runningHours: 38210,
    bearingTemp: 61,
    vibration: 1.9,
  },
  {
    id: "eq-4",
    tag: "21-AT-101",
    name: "Attemperator / Desuperheater",
    system: "Main Steam System",
    health: "healthy",
    nextPM: "2026-09-01",
    type: "Spray Desuperheating Station",
    oem: "BOMAFA",
    location: "Superheater Outlet Section",
    commissionDate: "2011-03-14",
    runningHours: 42180,
  },
  {
    id: "eq-5",
    tag: "21-BLR-003",
    name: "Superheater Tube Bank",
    system: "Boiler",
    health: "critical",
    nextPM: "2026-07-10",
    type: "Superheater Tube Bundle",
    oem: "BHEL",
    location: "Boiler, Superheater Zone",
    commissionDate: "2011-03-14",
    runningHours: 42180,
    lastTrip: "2026-07-06 — Tube leak isolated",
  },
  {
    id: "eq-6",
    tag: "21-GEN-001",
    name: "Generator Exciter",
    system: "Turbine-Generator",
    health: "warning",
    nextPM: "2026-07-12",
    type: "Brushless Exciter",
    oem: "BHEL",
    location: "Turbine Building, Generator End",
    commissionDate: "2011-05-02",
    runningHours: 40012,
  },
];

export const maintenanceEvents: MaintenanceEvent[] = [
  {
    id: "me-1",
    equipmentId: "eq-1",
    date: "2026-06-22",
    type: "Emergency",
    description: "High vibration trip — inspected coupling alignment, realigned within tolerance.",
    performedBy: "M. Reddy (Mech Maint)",
    durationHrs: 6,
  },
  {
    id: "me-2",
    equipmentId: "eq-1",
    date: "2026-04-15",
    type: "PM",
    description: "Quarterly bearing lubrication and vibration analysis.",
    performedBy: "S. Iyer (Mech Maint)",
    durationHrs: 3,
  },
  {
    id: "me-3",
    equipmentId: "eq-1",
    date: "2026-01-10",
    type: "CM",
    description: "Bearing housing gasket replacement due to minor oil seepage.",
    performedBy: "R. Kumar (Mech Maint)",
    durationHrs: 4,
  },
  {
    id: "me-4",
    equipmentId: "eq-1",
    date: "2025-09-02",
    type: "Overhaul",
    description: "Major overhaul — bearing replacement, blade cleaning, coupling replacement.",
    performedBy: "OEM Service Team (TLT-Babcock)",
    durationHrs: 48,
  },
];

export const calendarEvents: CalendarEvent[] = [
  { id: "cal-1", title: "PM — HP Heater 3A tube inspection", date: "2026-07-08", status: "scheduled" },
  { id: "cal-2", title: "Annual overhaul — Generator exciter", date: "2026-07-12", status: "scheduled" },
  { id: "cal-3", title: "Valve testing — Main steam safety valves", date: "2026-07-15", status: "scheduled" },
  { id: "cal-4", title: "Superheater tube leak repair", date: "2026-07-07", status: "overdue" },
  { id: "cal-5", title: "ID Fan 3A bearing inspection", date: "2026-07-07", status: "overdue" },
  { id: "cal-6", title: "Monthly turbine hall safety inspection", date: "2026-07-03", status: "completed" },
];

export const incidents: Incident[] = [
  {
    id: "inc-1",
    title: "Superheater Tube Leak — Unit 3",
    date: "2026-07-06",
    severity: "high",
    status: "open",
    rootCause: "Long-term tube wall thinning from high-ash coal erosion combined with localized steam-side oxidation.",
    contributingFactors: [
      "Coal GCV fluctuation increasing ash content beyond design basis",
      "Extended run hours since last tube thickness survey",
      "Localized flow-accelerated corrosion at bend section",
    ],
    correctiveActions: [
      "Isolated affected tube section and rerouted flow",
      "Scheduled full tube thickness survey for adjacent banks",
      "Water chemistry review initiated",
    ],
  },
  {
    id: "inc-2",
    title: "ID Fan 3A High Vibration Trip",
    date: "2026-06-22",
    severity: "medium",
    status: "closed",
    rootCause: "Coupling misalignment developed after last overhaul, amplified by foundation bolt loosening.",
    contributingFactors: ["Foundation bolts not re-torqued post-overhaul", "Alignment check overdue by 1,200 hrs"],
    correctiveActions: ["Realigned coupling", "Re-torqued foundation bolts", "Updated PM interval for alignment checks"],
  },
];

export const complianceRows: ComplianceRow[] = [
  { regulation: "CEA Technical Standards", requirement: "Boiler safety valve testing", status: "pass", lastAudit: "2026-05-12", nextDue: "2026-11-12" },
  { regulation: "OISD-154", requirement: "Nitrogen system isolation valve provision", status: "warning", lastAudit: "2026-04-01", nextDue: "2026-07-15" },
  { regulation: "Factories Act", requirement: "Confined space entry permit records", status: "pass", lastAudit: "2026-06-01", nextDue: "2026-12-01" },
  { regulation: "Environment Clearance", requirement: "Stack emission monitoring", status: "pass", lastAudit: "2026-06-15", nextDue: "2026-09-15" },
  { regulation: "Electricity Rules", requirement: "Earthing resistance testing", status: "fail", lastAudit: "2025-12-20", nextDue: "2026-06-20" },
];

export const permits: PermitToWork[] = [
  { id: "ptw-1", type: "Hot Work", location: "Boiler House — Superheater platform", issuedTo: "M. Reddy", validTill: "2026-07-06 18:00", status: "active" },
  { id: "ptw-2", type: "Confined Space", location: "Condenser hotwell", issuedTo: "A. Sharma", validTill: "2026-07-07 08:00", status: "active" },
  { id: "ptw-3", type: "Electrical", location: "Generator exciter panel", issuedTo: "V. Nair", validTill: "2026-07-06 20:00", status: "active" },
  { id: "ptw-4", type: "Height", location: "ID Fan 3A platform", issuedTo: "S. Iyer", validTill: "2026-07-06 17:00", status: "active" },
  { id: "ptw-5", type: "Cold Work", location: "CHP conveyor belt", issuedTo: "R. Kumar", validTill: "2026-07-05 18:00", status: "closed" },
];

export const spareParts = [
  { partNumber: "BRG-SKF-22322", description: "Spherical roller bearing", stock: 3, reorderPoint: 2 },
  { partNumber: "CPL-FLEX-450", description: "Flexible coupling element", stock: 1, reorderPoint: 2 },
  { partNumber: "GSK-FN301-08", description: "Bearing housing gasket set", stock: 6, reorderPoint: 3 },
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
