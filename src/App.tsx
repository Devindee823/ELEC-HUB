
import { useState, type CSSProperties } from "react";

type Load = {
  id: number;
  name: string;
  power: number;
  quantity: number;
};

type SavedProject = {
  id: number;
  project: string;
  voltage: number;
  powerFactor: number;
  demandFactor: number;
  loads: Load[];
  connected: number;
  demand: number;
  current: number;
  date: string;
};

type CalculationResult = {
  connected: number;
  demand: number;
  current: number;
};

type CableResult = {
  size: number;
  capacity: number;
  voltageDrop: number;
  voltageDropPercent: number;
};

type SLDComponent = {
  id: number;
  type: string;
  name: string;
  detail: string;
};

type AppSettings = {
  profileName: string;
  profileEmail: string;
  theme: "dark" | "light";
  defaultVoltage: number;
  defaultPowerFactor: number;
};

const initialLoads: Load[] = [
  { id: 1, name: "Lighting", power: 2, quantity: 1 },
  { id: 2, name: "Air Conditioning", power: 5, quantity: 2 },
  { id: 3, name: "Power Sockets", power: 1, quantity: 4 },
];

const initialSLDComponents: SLDComponent[] = [
  { id: 1, type: "Transformer", name: "Transformer", detail: "11 kV / 400 V" },
  { id: 2, type: "MCCB", name: "Main Circuit Breaker", detail: "400 A MCCB" },
  { id: 3, type: "MDB", name: "Main Distribution Board", detail: "400 V Distribution" },
  { id: 4, type: "Feeder", name: "Lighting Feeder", detail: "Lighting Circuit" },
  { id: 5, type: "Feeder", name: "Socket Feeder", detail: "Power Socket Circuit" },
  { id: 6, type: "Feeder", name: "Motor Feeder", detail: "Motor Circuit" },
];

const menu = [
  "Dashboard",
  "Load Calculation",
  "Circuit Breaker Selection",
  "Cable Sizing",
  "SLD Generator",
  "My Projects",
  "Reports",
  "Settings",
];

const standardBreakers = [
  6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160,
  200, 250, 315, 400, 500, 630,
];

// Illustrative demonstration values only.
// These are not certified cable ampacity values.
const cableData = [
  { size: 1.5, copper: 18, aluminium: 0 },
  { size: 2.5, copper: 24, aluminium: 18 },
  { size: 4, copper: 32, aluminium: 25 },
  { size: 6, copper: 41, aluminium: 32 },
  { size: 10, copper: 57, aluminium: 44 },
  { size: 16, copper: 76, aluminium: 59 },
  { size: 25, copper: 101, aluminium: 78 },
  { size: 35, copper: 125, aluminium: 96 },
  { size: 50, copper: 151, aluminium: 116 },
  { size: 70, copper: 192, aluminium: 148 },
  { size: 95, copper: 232, aluminium: 179 },
  { size: 120, copper: 269, aluminium: 207 },
  { size: 150, copper: 309, aluminium: 238 },
  { size: 185, copper: 353, aluminium: 272 },
  { size: 240, copper: 415, aluminium: 320 },
];

const defaultSettings: AppSettings = {
  profileName: "ELEC-HUB User",
  profileEmail: "",
  theme: "dark",
  defaultVoltage: 400,
  defaultPowerFactor: 0.85,
};

function readSavedProjects(): SavedProject[] {
  try {
    return JSON.parse(
      localStorage.getItem("elecHubProjects") || "[]"
    ) as SavedProject[];
  } catch {
    return [];
  }
}

function readSettings(): AppSettings {
  try {
    const saved = localStorage.getItem("elecHubSettings");
    return saved
      ? { ...defaultSettings, ...JSON.parse(saved) }
      : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export default function App() {
  const [active, setActive] = useState("Dashboard");

  const [project, setProject] = useState("New Electrical Project");
  const [voltage, setVoltage] = useState(400);
  const [powerFactor, setPowerFactor] = useState(0.85);
  const [demandFactor, setDemandFactor] = useState(1);

  const [loads, setLoads] = useState<Load[]>(initialLoads);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const [savedProjects, setSavedProjects] =
    useState<SavedProject[]>(readSavedProjects);

  // SETTINGS
  const [profileName, setProfileName] = useState(
    () => readSettings().profileName
  );
  const [profileEmail, setProfileEmail] = useState(
    () => readSettings().profileEmail
  );
  const [theme, setTheme] = useState<"dark" | "light">(
    () => readSettings().theme
  );
  const [defaultVoltage, setDefaultVoltage] = useState(
    () => readSettings().defaultVoltage
  );
  const [defaultPowerFactor, setDefaultPowerFactor] = useState(
    () => readSettings().defaultPowerFactor
  );

  // CIRCUIT BREAKER
  const [designCurrent, setDesignCurrent] = useState(32);
  const [breakerType, setBreakerType] = useState("MCB");
  const [breakerPoles, setBreakerPoles] = useState("3P");
  const [cableCapacity, setCableCapacity] = useState(40);
  const [faultLevel, setFaultLevel] = useState(6);

  // CABLE SIZING
  const [cableCurrent, setCableCurrent] = useState(38);
  const [cableMaterial, setCableMaterial] = useState("Copper");
  const [cableInsulation, setCableInsulation] = useState("XLPE");
  const [cablePhase, setCablePhase] = useState("Three Phase");
  const [cableVoltage, setCableVoltage] = useState(400);
  const [cableLength, setCableLength] = useState(50);
  const [cablePowerFactor, setCablePowerFactor] = useState(0.85);
  const [maxVoltageDrop, setMaxVoltageDrop] = useState(3);
  const [cableResult, setCableResult] = useState<CableResult | null>(null);
  const [cableMessage, setCableMessage] = useState("");

  // SLD GENERATOR
  const [sldComponents, setSldComponents] =
    useState<SLDComponent[]>(initialSLDComponents);
  const [editingSLDId, setEditingSLDId] = useState<number | null>(null);
  const [editSLDName, setEditSLDName] = useState("");
  const [editSLDDetail, setEditSLDDetail] = useState("");

  const isDark = theme === "dark";

  const colors = {
    background: isDark ? "#080f1e" : "#f1f5f9",
    sidebar: isDark ? "#0d1729" : "#ffffff",
    card: isDark ? "#111e32" : "#ffffff",
    input: isDark ? "#080f1e" : "#f8fafc",
    text: isDark ? "#e5edf9" : "#172033",
    muted: isDark ? "#91a3bd" : "#64748b",
    border: isDark ? "#263650" : "#dbe3ee",
    component: isDark ? "#172c49" : "#eaf2ff",
    preview: isDark ? "#080f1e" : "#f8fafc",
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    background: colors.input,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: 7,
    padding: 11,
    marginTop: 7,
  };

  const cardStyle: CSSProperties = {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: 11,
    padding: 20,
    color: colors.text,
  };

  const buttonStyle: CSSProperties = {
    background: "#2563eb",
    color: "white",
    border: 0,
    borderRadius: 7,
    padding: "11px 17px",
    cursor: "pointer",
    fontWeight: 700,
  };

  const totalLoad = loads.reduce(
    (sum, load) => sum + load.power * load.quantity,
    0
  );

  const selectedBreaker = standardBreakers.find(
    (rating) => rating >= designCurrent
  );

  // LOAD CALCULATION
  function calculateLoad() {
    if (
      voltage <= 0 ||
      powerFactor <= 0 ||
      powerFactor > 1 ||
      demandFactor < 0 ||
      demandFactor > 1 ||
      totalLoad <= 0 ||
      !Number.isFinite(voltage) ||
      !Number.isFinite(powerFactor)
    ) {
      alert("Please check your calculation inputs.");
      return;
    }

    const connected = totalLoad;
    const demand = connected * demandFactor;
    const current =
      (demand * 1000) /
      (Math.sqrt(3) * voltage * powerFactor);

    setResult({ connected, demand, current });
  }

  function updateLoad(
    id: number,
    field: "name" | "power" | "quantity",
    value: string
  ) {
    setLoads((previous) =>
      previous.map((load) =>
        load.id === id
          ? {
              ...load,
              [field]:
                field === "name"
                  ? value
                  : Math.max(0, Number(value)),
            }
          : load
      )
    );
    setResult(null);
  }

  function addLoad() {
    setLoads((previous) => [
      ...previous,
      {
        id: Date.now(),
        name: "New Equipment",
        power: 1,
        quantity: 1,
      },
    ]);
    setResult(null);
  }

  function removeLoad(id: number) {
    setLoads((previous) =>
      previous.filter((load) => load.id !== id)
    );
    setResult(null);
  }

  // SAVE AND OPEN PROJECTS
  function saveProject() {
    if (!result) {
      alert("Please calculate the load first.");
      return;
    }

    const newProject: SavedProject = {
      id: Date.now(),
      project,
      voltage,
      powerFactor,
      demandFactor,
      loads: [...loads],
      connected: result.connected,
      demand: result.demand,
      current: result.current,
      date: new Date().toLocaleDateString(),
    };

    const updated = [...savedProjects, newProject];

    try {
      localStorage.setItem("elecHubProjects", JSON.stringify(updated));
      setSavedProjects(updated);
      alert("Project saved successfully!");
    } catch {
      alert("Unable to save this project in your browser.");
    }
  }

  function openProject(saved: SavedProject) {
    setProject(saved.project);
    setVoltage(saved.voltage);
    setPowerFactor(saved.powerFactor);
    setDemandFactor(saved.demandFactor);
    setLoads(saved.loads);
    setResult({
      connected: saved.connected,
      demand: saved.demand,
      current: saved.current,
    });
    setActive("Load Calculation");
  }

  function deleteProject(id: number) {
    if (!window.confirm("Delete this project?")) return;

    const updated = savedProjects.filter((item) => item.id !== id);
    setSavedProjects(updated);
    localStorage.setItem("elecHubProjects", JSON.stringify(updated));
  }

  // REPORT GENERATION
  function generateProjectReport(saved: SavedProject) {
    const escapeHtml = (value: string | number) =>
      String(value).replace(/[&<>"']/g, (character) => {
        const entities: Record<string, string> = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        };
        return entities[character];
      });

    const reportWindow = window.open("", "_blank");

    if (!reportWindow) {
      alert("Please allow pop-ups in your browser to print the report.");
      return;
    }

    const equipmentRows = saved.loads
      .map(
        (load) => `
          <tr>
            <td>${escapeHtml(load.name)}</td>
            <td>${load.power.toFixed(2)} kW</td>
            <td>${load.quantity}</td>
            <td>${(load.power * load.quantity).toFixed(2)} kW</td>
          </tr>
        `
      )
      .join("");

    reportWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${escapeHtml(saved.project)} - ELEC-HUB Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #1e293b;
            padding: 35px;
            max-width: 900px;
            margin: auto;
          }
          h1 { color: #1d4ed8; }
          h2 {
            color: #1e40af;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 8px;
            margin-top: 30px;
          }
          .info {
            background: #eff6ff;
            padding: 15px;
            border-radius: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 10px;
            text-align: left;
          }
          th { background: #eff6ff; }
          .notice {
            margin-top: 30px;
            padding: 12px;
            background: #fff7ed;
            border: 1px solid #fed7aa;
            font-size: 12px;
          }
          @media print {
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        <h1>ELEC-HUB</h1>
        <h2>Electrical Project Report</h2>

        <div class="info">
          <p><strong>Project Name:</strong> ${escapeHtml(saved.project)}</p>
          <p><strong>Report Date:</strong> ${escapeHtml(new Date().toLocaleDateString())}</p>
          <p><strong>Project Saved Date:</strong> ${escapeHtml(saved.date)}</p>
          <p><strong>Supply Voltage:</strong> ${saved.voltage} V</p>
          <p><strong>Power Factor:</strong> ${saved.powerFactor}</p>
          <p><strong>Demand Factor:</strong> ${saved.demandFactor}</p>
        </div>

        <h2>Load Summary</h2>
        <p><strong>Connected Load:</strong> ${saved.connected.toFixed(2)} kW</p>
        <p><strong>Demand Load:</strong> ${saved.demand.toFixed(2)} kW</p>
        <p><strong>Estimated Current:</strong> ${saved.current.toFixed(2)} A</p>

        <h2>Electrical Equipment Details</h2>
        <table>
          <thead>
            <tr>
              <th>Equipment</th>
              <th>Power</th>
              <th>Quantity</th>
              <th>Total Power</th>
            </tr>
          </thead>
          <tbody>${equipmentRows}</tbody>
        </table>

        <div class="notice">
          <strong>Engineering Notice:</strong>
          This report contains preliminary load-calculation results
          from the ELEC-HUB educational prototype. It is not an
          approved electrical design. A qualified electrical engineer
          must verify all calculations and design requirements before
          practical use.
        </div>
      </body>
      </html>
    `);

    reportWindow.document.close();
    reportWindow.onload = () => reportWindow.print();
  }

  // CABLE SIZING
  function calculateCable() {
    setCableResult(null);
    setCableMessage("");

    if (
      !Number.isFinite(cableCurrent) ||
      !Number.isFinite(cableVoltage) ||
      !Number.isFinite(cableLength) ||
      !Number.isFinite(cablePowerFactor) ||
      !Number.isFinite(maxVoltageDrop) ||
      cableCurrent <= 0 ||
      cableVoltage <= 0 ||
      cableLength <= 0 ||
      cablePowerFactor <= 0 ||
      cablePowerFactor > 1 ||
      maxVoltageDrop <= 0
    ) {
      setCableMessage("Please enter valid positive values. Power factor must be above 0 and no greater than 1.");
      return;
    }

    const resistivity =
      cableMaterial === "Copper" ? 0.0175 : 0.0282;
    const isSinglePhase = cablePhase === "Single Phase";

    const selected = cableData.find((cable) => {
      const capacity =
        cableMaterial === "Copper"
          ? cable.copper
          : cable.aluminium;

      if (capacity === 0 || capacity < cableCurrent) return false;

      const voltageDrop = isSinglePhase
        ? (2 * resistivity * cableLength * cableCurrent * cablePowerFactor) / cable.size
        : (Math.sqrt(3) * resistivity * cableLength * cableCurrent * cablePowerFactor) / cable.size;

      return (voltageDrop / cableVoltage) * 100 <= maxVoltageDrop;
    });

    if (!selected) {
      setCableMessage("No suitable size was found in this demonstration table. Check your inputs or use a verified cable-sizing method.");
      return;
    }

    const capacity =
      cableMaterial === "Copper"
        ? selected.copper
        : selected.aluminium;

    const voltageDrop = isSinglePhase
      ? (2 * resistivity * cableLength * cableCurrent * cablePowerFactor) / selected.size
      : (Math.sqrt(3) * resistivity * cableLength * cableCurrent * cablePowerFactor) / selected.size;

    const voltageDropPercent =
      (voltageDrop / cableVoltage) * 100;

    setCableResult({
      size: selected.size,
      capacity,
      voltageDrop,
      voltageDropPercent,
    });
  }

  // SLD FUNCTIONS
  function addSLDComponent(type: string, name: string, detail: string) {
    const newComponent: SLDComponent = {
      id: Date.now() + Math.random(),
      type,
      name,
      detail,
    };
    setSldComponents((previous) => [...previous, newComponent]);
  }

  function removeSLDComponent(id: number) {
    setSldComponents((previous) =>
      previous.filter((component) => component.id !== id)
    );
    if (editingSLDId === id) cancelSLDEdit();
  }

  function startEditingSLD(component: SLDComponent) {
    setEditingSLDId(component.id);
    setEditSLDName(component.name);
    setEditSLDDetail(component.detail);
  }

  function saveSLDEdit() {
    if (editingSLDId === null) return;

    if (!editSLDName.trim() || !editSLDDetail.trim()) {
      alert("Please enter both the component name and details.");
      return;
    }

    setSldComponents((previous) =>
      previous.map((component) =>
        component.id === editingSLDId
          ? {
              ...component,
              name: editSLDName.trim(),
              detail: editSLDDetail.trim(),
            }
          : component
      )
    );
    cancelSLDEdit();
  }

  function cancelSLDEdit() {
    setEditingSLDId(null);
    setEditSLDName("");
    setEditSLDDetail("");
  }

  function clearSLD() {
    if (!window.confirm("Clear the entire SLD diagram?")) return;
    setSldComponents([]);
    cancelSLDEdit();
  }

  function resetSLD() {
    setSldComponents(
      initialSLDComponents.map((component) => ({
        ...component,
        id: Date.now() + Math.random(),
      }))
    );
    cancelSLDEdit();
  }

  function moveSLDComponent(id: number, direction: "up" | "down") {
    setSldComponents((previous) => {
      const currentIndex = previous.findIndex((item) => item.id === id);
      if (currentIndex === -1) return previous;

      const newIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (newIndex < 0 || newIndex >= previous.length) return previous;

      const updated = [...previous];
      [updated[currentIndex], updated[newIndex]] = [
        updated[newIndex],
        updated[currentIndex],
      ];
      return updated;
    });
  }

  function getSLDIcon(type: string) {
    switch (type) {
      case "Transformer": return "⚡";
      case "Generator": return "🔋";
      case "MCCB": return "🔌";
      case "MDB": return "▤";
      case "Feeder": return "↗";
      default: return "◆";
    }
  }

  const mainSLDComponents = sldComponents.filter(
    (component) => component.type !== "Feeder"
  );
  const feederSLDComponents = sldComponents.filter(
    (component) => component.type === "Feeder"
  );

  function renderSLDComponent(
    component: SLDComponent,
    showMoveButtons = true
  ) {
    const componentIndex = sldComponents.findIndex(
      (item) => item.id === component.id
    );

    return (
      <div
        key={component.id}
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: colors.component,
          border: "2px solid #3b82f6",
          borderRadius: 10,
          padding: 15,
          color: colors.text,
        }}
      >
        {editingSLDId === component.id ? (
          <>
            <h3 style={{ color: "#2563eb" }}>Edit {component.type}</h3>

            <label>Component Name</label>
            <input
              style={inputStyle}
              value={editSLDName}
              onChange={(e) => setEditSLDName(e.target.value)}
            />

            <label>Rating / Details</label>
            <input
              style={inputStyle}
              value={editSLDDetail}
              onChange={(e) => setEditSLDDetail(e.target.value)}
            />

            <div style={{ display: "flex", gap: 8, marginTop: 15, flexWrap: "wrap" }}>
              <button onClick={saveSLDEdit} style={{ ...buttonStyle, background: "#059669" }}>
                Save Changes
              </button>
              <button onClick={cancelSLDEdit} style={{ ...buttonStyle, background: "#475569" }}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "#2563eb", fontSize: 12, fontWeight: 700 }}>
                {getSLDIcon(component.type)} {component.type}
              </div>
              <strong>{component.name}</strong>
              <div style={{ color: colors.muted, fontSize: 12, marginTop: 5 }}>
                {component.detail}
              </div>
            </div>

            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {showMoveButtons && (
                <>
                  <button
                    onClick={() => moveSLDComponent(component.id, "up")}
                    disabled={componentIndex === 0}
                    style={{ ...buttonStyle, background: "#475569", padding: "7px 9px", opacity: componentIndex === 0 ? 0.5 : 1 }}
                  >↑</button>
                  <button
                    onClick={() => moveSLDComponent(component.id, "down")}
                    disabled={componentIndex === sldComponents.length - 1}
                    style={{ ...buttonStyle, background: "#475569", padding: "7px 9px", opacity: componentIndex === sldComponents.length - 1 ? 0.5 : 1 }}
                  >↓</button>
                </>
              )}
              <button onClick={() => startEditingSLD(component)} style={{ ...buttonStyle, padding: "7px 10px" }}>
                Edit
              </button>
              <button onClick={() => removeSLDComponent(component.id)} style={{ ...buttonStyle, background: "#991b1b", padding: "7px 10px" }}>
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // SETTINGS FUNCTIONS
  function saveSettings() {
    if (
      !Number.isFinite(defaultVoltage) ||
      defaultVoltage <= 0 ||
      !Number.isFinite(defaultPowerFactor) ||
      defaultPowerFactor <= 0 ||
      defaultPowerFactor > 1
    ) {
      alert("Please enter a valid default voltage and power factor.");
      return;
    }

    const settings: AppSettings = {
      profileName,
      profileEmail,
      theme,
      defaultVoltage,
      defaultPowerFactor,
    };

    try {
      localStorage.setItem("elecHubSettings", JSON.stringify(settings));
      alert("Settings saved successfully!");
    } catch {
      alert("Unable to save settings.");
    }
  }

  function applyDefaultValues() {
    if (
      defaultVoltage <= 0 ||
      defaultPowerFactor <= 0 ||
      defaultPowerFactor > 1
    ) {
      alert("Please enter valid default values first.");
      return;
    }

    setVoltage(defaultVoltage);
    setPowerFactor(defaultPowerFactor);
    setCableVoltage(defaultVoltage);
    setCablePowerFactor(defaultPowerFactor);
    setActive("Load Calculation");
    setResult(null);
  }

  function exportProjects() {
    try {
      const data = JSON.stringify(savedProjects, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "elec-hub-projects.json";
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch {
      alert("Unable to export projects.");
    }
  }

  function clearAllProjects() {
    if (!window.confirm("Are you sure you want to delete all saved projects? This cannot be undone.")) {
      return;
    }

    setSavedProjects([]);
    localStorage.removeItem("elecHubProjects");
    alert("All saved projects have been deleted.");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.background,
        color: colors.text,
        fontFamily: "Arial, sans-serif",
        display: "flex",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          width: 245,
          flexShrink: 0,
          background: colors.sidebar,
          borderRight: `1px solid ${colors.border}`,
          padding: 20,
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ color: "#60a5fa" }}>⚡ ELEC-HUB</h2>
        <p style={{ color: colors.muted, fontSize: 10 }}>
          ENGINEERING PLATFORM
        </p>
        <p style={{ color: colors.muted, marginTop: 35 }}>MAIN MENU</p>

        {menu.map((item) => (
          <button
            key={item}
            onClick={() => setActive(item)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: 12,
              marginBottom: 5,
              border: 0,
              borderRadius: 7,
              color: active === item ? "#60a5fa" : colors.text,
              background: active === item ? (isDark ? "#172c49" : "#dbeafe") : "transparent",
              cursor: "pointer",
            }}
          >
            {item === "Dashboard" ? "▦" : "⚡"} &nbsp; {item}
          </button>
        ))}
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, minWidth: 0, padding: 28 }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 28,
          }}
        >
          <div>
            <small style={{ color: colors.muted }}>
              ELECTRICAL ENGINEERING / WORKSPACE
            </small>
            <h1>{active}</h1>
          </div>
          <div
            title={profileName}
            style={{
              background: "#1d4ed8",
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              color: "white",
              fontWeight: 700,
            }}
          >
            {(profileName.trim()[0] || "H").toUpperCase()}
          </div>
        </header>

        {/* DASHBOARD */}
        {active === "Dashboard" && (
          <>
            <section
              style={{
                background: "linear-gradient(110deg,#12336a,#102044)",
                border: "1px solid #24477d",
                borderRadius: 14,
                padding: 25,
                marginBottom: 25,
                color: "white",
              }}
            >
              <small style={{ color: "#93c5fd" }}>WELCOME TO ELEC-HUB</small>
              <h2>Engineering made smarter.</h2>
              <p style={{ color: "#b4c8e4" }}>
                Calculate, design, manage and generate electrical engineering reports.
              </p>
              <button style={buttonStyle} onClick={() => setActive("Load Calculation")}>
                Start Calculating →
              </button>
            </section>

            <h3>Engineering Tools</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 15 }}>
              {[
                ["⚡", "Load Calculation"],
                ["🔌", "Circuit Breaker Selection"],
                ["🔧", "Cable Sizing"],
                ["📐", "SLD Generator"],
              ].map(([icon, title]) => (
                <button
                  key={title}
                  onClick={() => setActive(title)}
                  style={{ ...cardStyle, textAlign: "left", cursor: "pointer" }}
                >
                  <div style={{ fontSize: 28 }}>{icon}</div>
                  <h3>{title}</h3>
                  <small style={{ color: "#60a5fa" }}>Open tool →</small>
                </button>
              ))}
            </div>
          </>
        )}

        {/* LOAD CALCULATION */}
        {active === "Load Calculation" && (
          <>
            <section style={cardStyle}>
              <h2>⚡ Electrical Load Calculator</h2>
              <label>Project Name</label>
              <input style={inputStyle} value={project} onChange={(e) => setProject(e.target.value)} />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 15, marginTop: 20 }}>
                <div>
                  <label>Supply Voltage (V)</label>
                  <input style={inputStyle} type="number" value={voltage} onChange={(e) => setVoltage(Number(e.target.value))} />
                </div>
                <div>
                  <label>Power Factor</label>
                  <input style={inputStyle} type="number" step="0.01" value={powerFactor} onChange={(e) => setPowerFactor(Number(e.target.value))} />
                </div>
                <div>
                  <label>Demand Factor</label>
                  <input style={inputStyle} type="number" step="0.01" value={demandFactor} onChange={(e) => setDemandFactor(Number(e.target.value))} />
                </div>
              </div>
            </section>

            <section style={{ ...cardStyle, marginTop: 20 }}>
              <h3>Electrical Equipment</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", textAlign: "left" }}>
                  <thead>
                    <tr>
                      <th>Equipment</th>
                      <th>Power (kW)</th>
                      <th>Quantity</th>
                      <th>Total (kW)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loads.map((load) => (
                      <tr key={load.id}>
                        <td>
                          <input style={inputStyle} value={load.name} onChange={(e) => updateLoad(load.id, "name", e.target.value)} />
                        </td>
                        <td>
                          <input style={inputStyle} type="number" min="0" value={load.power} onChange={(e) => updateLoad(load.id, "power", e.target.value)} />
                        </td>
                        <td>
                          <input style={inputStyle} type="number" min="0" value={load.quantity} onChange={(e) => updateLoad(load.id, "quantity", e.target.value)} />
                        </td>
                        <td>{(load.power * load.quantity).toFixed(2)}</td>
                        <td>
                          <button onClick={() => removeLoad(load.id)} style={{ ...buttonStyle, background: "#991b1b" }}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button onClick={addLoad} style={{ ...buttonStyle, marginTop: 18, background: "#334155" }}>
                + Add Equipment
              </button>
              <h3>Total Connected Load: {totalLoad.toFixed(2)} kW</h3>
              <button onClick={calculateLoad} style={buttonStyle}>Calculate Load →</button>
            </section>

            {result && (
              <section style={{ ...cardStyle, marginTop: 20 }}>
                <h2>Calculation Results</h2>
                <h3>Connected Load: {result.connected.toFixed(2)} kW</h3>
                <h3>Demand Load: {result.demand.toFixed(2)} kW</h3>
                <h2 style={{ color: "#4ade80" }}>Estimated Current: {result.current.toFixed(2)} A</h2>
                <button onClick={saveProject} style={{ ...buttonStyle, background: "#059669" }}>
                  💾 Save Project
                </button>
                <p style={{ color: colors.muted, fontSize: 11 }}>
                  Preliminary balanced three-phase estimate only. Verify all design assumptions before practical use.
                </p>
              </section>
            )}
          </>
        )}

        {/* CIRCUIT BREAKER SELECTION */}
        {active === "Circuit Breaker Selection" && (
          <>
            <section style={cardStyle}>
              <h2>🔌 Circuit Breaker Selection</h2>
              <p style={{ color: colors.muted }}>Preliminary breaker rating screening tool.</p>

              <label>Design Current (A)</label>
              <input style={inputStyle} type="number" min="0" value={designCurrent} onChange={(e) => setDesignCurrent(Number(e.target.value))} />

              <label>Breaker Type</label>
              <select style={inputStyle} value={breakerType} onChange={(e) => setBreakerType(e.target.value)}>
                <option value="MCB">MCB</option>
                <option value="MCCB">MCCB</option>
              </select>

              <label>Number of Poles</label>
              <select style={inputStyle} value={breakerPoles} onChange={(e) => setBreakerPoles(e.target.value)}>
                <option value="1P">1 Pole</option>
                <option value="2P">2 Poles</option>
                <option value="3P">3 Poles</option>
                <option value="4P">4 Poles</option>
              </select>

              <label>Protected Cable Current Capacity (A)</label>
              <input style={inputStyle} type="number" min="0" value={cableCapacity} onChange={(e) => setCableCapacity(Number(e.target.value))} />

              <label>Available Fault Level (kA)</label>
              <input style={inputStyle} type="number" min="0" step="0.1" value={faultLevel} onChange={(e) => setFaultLevel(Number(e.target.value))} />
            </section>

            <section style={{ ...cardStyle, marginTop: 20 }}>
              <h2>Selection Result</h2>
              <p>Breaker type: <strong>{breakerType}</strong></p>
              <p>Poles: <strong>{breakerPoles}</strong></p>

              {designCurrent <= 0 || !Number.isFinite(designCurrent) ? (
                <h3 style={{ color: "#f87171" }}>Enter a valid positive design current.</h3>
              ) : selectedBreaker === undefined ? (
                <h3 style={{ color: "#f87171" }}>No rating available in this prototype list.</h3>
              ) : (
                <>
                  <h3>Design Current: {designCurrent} A</h3>
                  <h1 style={{ color: "#60a5fa" }}>Suggested Rating: {selectedBreaker} A</h1>
                  <p>Cable capacity: {cableCapacity} A</p>
                  <p>Available fault level: {faultLevel} kA</p>
                  {selectedBreaker <= cableCapacity && cableCapacity > 0 && faultLevel > 0 ? (
                    <p style={{ color: "#4ade80" }}>Preliminary rating and cable-current check passed. Fault breaking-capacity verification is still required.</p>
                  ) : (
                    <p style={{ color: "#f87171" }}>Preliminary checks failed. Review the cable capacity and input values.</p>
                  )}
                </>
              )}

              <p style={{ color: colors.muted, fontSize: 12 }}>
                IMPORTANT: This prototype does not verify overload coordination, trip characteristics, breaking capacity, selectivity, installation conditions or applicable standards. It is not suitable for approving a real installation. Have a qualified electrical engineer verify the design.
              </p>
            </section>
          </>
        )}

        {/* CABLE SIZING */}
        {active === "Cable Sizing" && (
          <>
            <section style={cardStyle}>
              <h2>🔧 Cable Sizing Calculator</h2>
              <p style={{ color: colors.muted }}>Preliminary cable-size and voltage-drop demonstration.</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 15 }}>
                <div>
                  <label>Design Current (A)</label>
                  <input style={inputStyle} type="number" min="0.1" value={cableCurrent} onChange={(e) => { setCableCurrent(Number(e.target.value)); setCableResult(null); }} />
                </div>
                <div>
                  <label>Cable Material</label>
                  <select style={inputStyle} value={cableMaterial} onChange={(e) => { setCableMaterial(e.target.value); setCableResult(null); }}>
                    <option value="Copper">Copper</option>
                    <option value="Aluminium">Aluminium</option>
                  </select>
                </div>
                <div>
                  <label>Cable Insulation</label>
                  <select style={inputStyle} value={cableInsulation} onChange={(e) => setCableInsulation(e.target.value)}>
                    <option value="PVC">PVC</option>
                    <option value="XLPE">XLPE</option>
                  </select>
                </div>
                <div>
                  <label>Supply System</label>
                  <select style={inputStyle} value={cablePhase} onChange={(e) => { setCablePhase(e.target.value); setCableResult(null); }}>
                    <option value="Single Phase">Single Phase</option>
                    <option value="Three Phase">Three Phase</option>
                  </select>
                </div>
                <div>
                  <label>Supply Voltage (V)</label>
                  <input style={inputStyle} type="number" min="1" value={cableVoltage} onChange={(e) => setCableVoltage(Number(e.target.value))} />
                </div>
                <div>
                  <label>Cable Length (m)</label>
                  <input style={inputStyle} type="number" min="0.1" value={cableLength} onChange={(e) => { setCableLength(Number(e.target.value)); setCableResult(null); }} />
                </div>
                <div>
                  <label>Power Factor</label>
                  <input style={inputStyle} type="number" min="0.01" max="1" step="0.01" value={cablePowerFactor} onChange={(e) => setCablePowerFactor(Number(e.target.value))} />
                </div>
                <div>
                  <label>Maximum Voltage Drop (%)</label>
                  <input style={inputStyle} type="number" min="0.1" step="0.1" value={maxVoltageDrop} onChange={(e) => { setMaxVoltageDrop(Number(e.target.value)); setCableResult(null); }} />
                </div>
              </div>

              <button onClick={calculateCable} style={{ ...buttonStyle, marginTop: 22 }}>
                Calculate Cable Size →
              </button>
            </section>

            {cableMessage && (
              <section style={{ ...cardStyle, marginTop: 20, borderColor: "#b45309" }}>
                <h3 style={{ color: "#fbbf24" }}>Check Your Inputs</h3>
                <p>{cableMessage}</p>
              </section>
            )}

            {cableResult && (
              <section style={{ ...cardStyle, marginTop: 20 }}>
                <h2>📊 Cable Sizing Results</h2>
                <h3>Design Current: {cableCurrent} A</h3>
                <h1 style={{ color: "#60a5fa" }}>Suggested Cable Size: {cableResult.size} mm²</h1>
                <p>Cable Material: {cableMaterial}</p>
                <p>Insulation: {cableInsulation}</p>
                <p>Illustrative Current Capacity: {cableResult.capacity} A</p>
                <p>Estimated Voltage Drop: {cableResult.voltageDrop.toFixed(2)} V</p>
                <h2 style={{ color: "#4ade80" }}>Voltage Drop: {cableResult.voltageDropPercent.toFixed(2)}%</h2>
                <p>Maximum Permitted Drop Entered: {maxVoltageDrop}%</p>
                <p style={{ color: "#fbbf24", fontSize: 12 }}>
                  This result is NOT a certified cable selection. The demonstration capacity table is not based on a specified installation method or verified standard. The voltage-drop estimate omits reactance and operating-temperature corrections. Do not use this result to install or approve an actual electrical circuit.
                </p>
              </section>
            )}

            <section style={{ ...cardStyle, marginTop: 20 }}>
              <h3>About This Calculator</h3>
              <p style={{ color: colors.muted }}>
                This early prototype does not include installation method, ambient temperature, grouping factors, soil conditions, protective-device coordination or short-circuit thermal withstand checks.
              </p>
            </section>
          </>
        )}

        {/* SLD GENERATOR */}
        {active === "SLD Generator" && (
          <>
            <section style={cardStyle}>
              <h2>📐 Single Line Diagram Generator</h2>
              <p style={{ color: colors.muted }}>
                Add, edit, remove and arrange electrical components to create a preliminary single-line diagram.
              </p>
              <h3>Add Electrical Components</h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
                <button style={buttonStyle} onClick={() => addSLDComponent("Transformer", "Transformer", "11 kV / 400 V")}>+ Transformer</button>
                <button style={{ ...buttonStyle, background: "#0f766e" }} onClick={() => addSLDComponent("Generator", "Generator", "400 V Generator")}>+ Generator</button>
                <button style={{ ...buttonStyle, background: "#475569" }} onClick={() => addSLDComponent("MCCB", "Main Circuit Breaker", "400 A MCCB")}>+ Main MCCB</button>
                <button style={{ ...buttonStyle, background: "#7c3aed" }} onClick={() => addSLDComponent("MDB", "Main Distribution Board", "400 V Distribution")}>+ MDB</button>
                <button style={{ ...buttonStyle, background: "#0369a1" }} onClick={() => addSLDComponent("Feeder", "Lighting Feeder", "Lighting Circuit")}>+ Lighting Feeder</button>
                <button style={{ ...buttonStyle, background: "#0369a1" }} onClick={() => addSLDComponent("Feeder", "Socket Feeder", "Power Socket Circuit")}>+ Socket Feeder</button>
                <button style={{ ...buttonStyle, background: "#0369a1" }} onClick={() => addSLDComponent("Feeder", "Motor Feeder", "Motor Circuit")}>+ Motor Feeder</button>
              </div>
            </section>

            <section style={{ ...cardStyle, marginTop: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2>SLD Diagram Preview</h2>
                  <p style={{ color: colors.muted }}>{sldComponents.length} components added</p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button style={{ ...buttonStyle, background: "#475569" }} onClick={resetSLD}>Reset Diagram</button>
                  <button style={{ ...buttonStyle, background: "#991b1b" }} onClick={clearSLD}>Clear Diagram</button>
                </div>
              </div>

              {sldComponents.length === 0 ? (
                <div style={{ border: `1px dashed ${colors.border}`, borderRadius: 10, padding: 35, textAlign: "center", color: colors.muted, marginTop: 20 }}>
                  <h3>No Components Added</h3>
                  <p>Use the buttons above to start your SLD diagram.</p>
                </div>
              ) : (
                <div style={{ marginTop: 25, padding: 20, background: colors.preview, border: `1px solid ${colors.border}`, borderRadius: 12, overflowX: "auto" }}>
                  <div style={{ color: "#2563eb", fontWeight: 700, marginBottom: 25, textAlign: "center" }}>
                    ELECTRICAL SINGLE LINE DIAGRAM
                  </div>

                  {mainSLDComponents.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      {mainSLDComponents.map((component, index) => (
                        <div key={component.id} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{ width: "min(100%, 420px)" }}>
                            {renderSLDComponent(component)}
                          </div>
                          {index < mainSLDComponents.length - 1 && (
                            <div style={{ height: 35, width: 3, background: "#60a5fa" }} />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ textAlign: "center", color: "#b45309" }}>
                      No main components added. Add a transformer, generator, MCCB or MDB.
                    </p>
                  )}

                  {feederSLDComponents.length > 0 && (
                    <div style={{ width: "100%", marginTop: 35 }}>
                      <h3 style={{ textAlign: "center", color: "#2563eb", marginBottom: 20 }}>
                        MDB FEEDER CONNECTIONS
                      </h3>
                      <div style={{ width: "85%", height: 4, background: "#60a5fa", margin: "0 auto" }} />
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 15, width: "100%" }}>
                        {feederSLDComponents.map((component) => (
                          <div key={component.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
                            <div style={{ width: 3, height: 30, background: "#60a5fa" }} />
                            {renderSLDComponent(component)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p style={{ color: colors.muted, fontSize: 11, marginTop: 25, textAlign: "center" }}>
                    Preliminary visual layout only. The displayed branches are not verified electrical connections.
                  </p>
                </div>
              )}
            </section>

            <section style={{ ...cardStyle, marginTop: 20, borderColor: "#92400e" }}>
              <h3 style={{ color: "#fbbf24" }}>Important Engineering Notice</h3>
              <p style={{ color: colors.muted, fontSize: 13 }}>
                This is an educational SLD prototype. The displayed sequence and feeder branches do not automatically establish correct electrical connections, protection coordination, ratings, fault levels, earthing arrangements or compliance with electrical standards. It must not be used as an approved construction drawing. A qualified electrical engineer must verify any real electrical design.
              </p>
            </section>
          </>
        )}

        {/* MY PROJECTS */}
        {active === "My Projects" && (
          <section style={cardStyle}>
            <h2>📁 My Saved Projects</h2>
            {savedProjects.length === 0 ? (
              <p>No saved projects yet.</p>
            ) : (
              savedProjects.map((saved) => (
                <div key={saved.id} style={{ borderTop: `1px solid ${colors.border}`, padding: 15 }}>
                  <h3>{saved.project}</h3>
                  <p>Saved: {saved.date}</p>
                  <p>Connected Load: {saved.connected.toFixed(2)} kW</p>
                  <p>Estimated Current: {saved.current.toFixed(2)} A</p>
                  <button onClick={() => openProject(saved)} style={buttonStyle}>Open Project</button>
                  <button onClick={() => deleteProject(saved.id)} style={{ ...buttonStyle, background: "#991b1b", marginLeft: 10 }}>Delete</button>
                </div>
              ))
            )}
          </section>
        )}

        {/* REPORTS */}
        {active === "Reports" && (
          <section style={cardStyle}>
            <h2>📄 Project Reports</h2>
            <p style={{ color: colors.muted }}>
              Generate printable electrical project reports using your saved load calculation data.
            </p>

            {savedProjects.length === 0 ? (
              <div style={{ padding: 20, background: colors.component, borderRadius: 8, marginTop: 20 }}>
                <h3>No Saved Projects</h3>
                <p>Please calculate and save a project first. Your saved projects will appear here.</p>
                <button style={buttonStyle} onClick={() => setActive("Load Calculation")}>
                  Go to Load Calculation →
                </button>
              </div>
            ) : (
              <div style={{ marginTop: 20 }}>
                {savedProjects.map((saved) => (
                  <div key={saved.id} style={{ border: `1px solid ${colors.border}`, background: colors.component, borderRadius: 10, padding: 18, marginBottom: 15 }}>
                    <h3>{saved.project}</h3>
                    <p style={{ color: colors.muted }}>Saved Date: {saved.date}</p>
                    <p>Connected Load: {saved.connected.toFixed(2)} kW</p>
                    <p>Demand Load: {saved.demand.toFixed(2)} kW</p>
                    <p>Estimated Current: {saved.current.toFixed(2)} A</p>
                    <p>Equipment Items: {saved.loads.length}</p>
                    <button style={{ ...buttonStyle, background: "#059669" }} onClick={() => generateProjectReport(saved)}>
                      📄 Generate / Print Report
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* SETTINGS */}
        {active === "Settings" && (
          <div style={{ display: "grid", gap: 20 }}>
            <section style={cardStyle}>
              <h2>👤 Profile Settings</h2>
              <p style={{ color: colors.muted }}>Update your profile information.</p>

              <label>Display Name</label>
              <input
                style={inputStyle}
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Enter your name"
              />

              <label>Email Address</label>
              <input
                style={inputStyle}
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </section>

            <section style={cardStyle}>
              <h2>🎨 Appearance</h2>
              <p style={{ color: colors.muted }}>Choose your preferred application theme.</p>

              <label>Application Theme</label>
              <select
                style={inputStyle}
                value={theme}
                onChange={(e) => setTheme(e.target.value as "dark" | "light")}
              >
                <option value="dark">Dark Mode</option>
                <option value="light">Light Mode</option>
              </select>

              <p style={{ color: colors.muted, fontSize: 12 }}>
                The application appearance changes immediately when you select a theme.
              </p>
            </section>

            <section style={cardStyle}>
              <h2>⚡ Project Settings</h2>
              <p style={{ color: colors.muted }}>Set default values for new calculations.</p>

              <label>Default Supply Voltage (V)</label>
              <input
                style={inputStyle}
                type="number"
                min="1"
                value={defaultVoltage}
                onChange={(e) => setDefaultVoltage(Number(e.target.value))}
              />

              <label>Default Power Factor</label>
              <input
                style={inputStyle}
                type="number"
                min="0.01"
                max="1"
                step="0.01"
                value={defaultPowerFactor}
                onChange={(e) => setDefaultPowerFactor(Number(e.target.value))}
              />

              <button style={{ ...buttonStyle, marginTop: 15 }} onClick={applyDefaultValues}>
                Apply Default Values
              </button>
            </section>

            <section style={cardStyle}>
              <h2>💾 Data Management</h2>
              <p style={{ color: colors.muted }}>Manage your saved electrical projects.</p>

              <p>Saved projects: <strong>{savedProjects.length}</strong></p>

              <button
                style={{ ...buttonStyle, background: "#059669", marginRight: 10, marginBottom: 10 }}
                onClick={exportProjects}
              >
                Export Projects (JSON)
              </button>

              <button
                style={{ ...buttonStyle, background: "#991b1b" }}
                onClick={clearAllProjects}
              >
                Delete All Projects
              </button>

              <p style={{ color: colors.muted, fontSize: 12 }}>
                Projects are stored locally in this browser. Export them before deleting if you need a backup.
              </p>
            </section>

            <section style={cardStyle}>
              <h2>ℹ️ About ELEC-HUB</h2>
              <h3 style={{ color: "#60a5fa" }}>⚡ ELEC-HUB</h3>
              <p>
                An Electrical Engineering Platform for preliminary calculations,
                electrical project management and single-line diagram visualization.
              </p>
              <p>Version: 1.0.0</p>
              <p>Year: 2026</p>
              <p style={{ color: colors.muted, fontSize: 12 }}>
                Educational prototype. All engineering results require verification by a qualified electrical engineer.
              </p>
            </section>

            <button
              style={{ ...buttonStyle, background: "#059669", padding: 14 }}
              onClick={saveSettings}
            >
              💾 Save Settings
            </button>
          </div>
        )}

        <footer style={{ textAlign: "center", color: colors.muted, fontSize: 11, marginTop: 35 }}>
          ELEC-HUB © 2026 · Electrical Engineering Platform
        </footer>
      </main>
    </div>
  );
}
