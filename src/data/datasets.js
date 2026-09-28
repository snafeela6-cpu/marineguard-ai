// MarineGuard AI - Acoustic Datasets & Ground Truth Telemetry
// Professional hydrographic data models for side-scan sonar intelligence

export const MISSION_DATASETS = [
  {
    id: "mission-ghost-net",
    name: "Mission Alpha-402: North Sea Benthic Ghost Net Survey",
    code: "MG-402-NS",
    targetType: "Ghost Nets & Plastic Entanglements",
    image: "/assets/sonar/dataset_ghost_nets.jpg",
    location: "Dogger Bank Marine Protected Area, North Sea",
    coordinates: { lat: 54.705, lon: 2.262 },
    coordsFormatted: "54° 42' 18\" N, 02° 15' 44\" E",
    depth: 38.5,
    altitude: 8.2,
    swathWidth: 100, // meters total (50m port / 50m stbd)
    frequency: "450 kHz Dual-Chirp",
    towSpeed: 3.2, // knots
    surveyDate: "2026-06-14 09:42 UTC",
    vessel: "R/V Ocean Sentinel (AUV Nautilus-X4)",
    operator: "Marine Conservation & Seabed Protection Unit",
    status: "CRITICAL HAZARD DETECTED",
    threatLevel: "critical",
    summary: "Large derelict commercial gillnet tangled across rocky seabed outcrop. High risk of continuous ghost-fishing mortality for marine mammals and benthic fauna. Active acoustic shadow indicates vertical net billowing up to 2.1m above seafloor.",
    detections: [
      {
        id: "det-gn-01",
        label: "Ghost Fishing Net",
        category: "Ghost Gear",
        confidence: 0.94,
        severity: "critical",
        box: { x: 22, y: 22, w: 26, h: 48 }, // percent relative to image
        shadowLength: 6.4, // meters
        estHeight: 2.1, // meters
        estArea: 48.6, // m^2
        acousticProfile: "Diffuse high-backscatter mesh with discontinuous shadow",
        recoveryPriority: "P1 - Immediate ROV Retrieval Required",
        material: "Nylon monofilament / braided synthetic polymer",
        environmentalImpact: "Severe: Ongoing marine life entrapment hazard; microplastic leaching",
        channel: "Port Swath & Nadir",
        verificationStatus: "AI DETECTED",
        verifiedBy: null,
        verifiedAt: null,
        aiExplanation: {
          acousticIntensity: 92,
          shadowSignature: 89,
          geometryMatch: 95,
          textureMatch: 91,
          contextMatch: 87,
          overallConfidence: 94,
          text: "Detected because the acoustic return shows a strong elongated signature with a persistent shadow pattern consistent with a suspended or seabed-contact object."
        }
      },
      {
        id: "det-gn-02",
        label: "Marine Plastic Cluster",
        category: "Marine Plastics",
        confidence: 0.88,
        severity: "high",
        box: { x: 52, y: 24, w: 28, h: 46 },
        shadowLength: 4.8,
        estHeight: 1.6,
        estArea: 32.1,
        acousticProfile: "Intertwined high-specularity line bundles",
        recoveryPriority: "P2 - Scheduled Recovery",
        material: "Polypropylene / leadline sinker rope",
        environmentalImpact: "High: Entanglement risk to benthic elasmobranchs",
        channel: "Starboard Swath",
        verificationStatus: "AI DETECTED",
        verifiedBy: null,
        verifiedAt: null,
        aiExplanation: {
          acousticIntensity: 86,
          shadowSignature: 84,
          geometryMatch: 90,
          textureMatch: 89,
          contextMatch: 91,
          overallConfidence: 88,
          text: "Diffuse multi-strand acoustic reflection with characteristic plastic density impedance and localized seafloor scour depression."
        }
      },
      {
        id: "det-gn-03",
        label: "Hazardous Drum",
        category: "Hazardous Containers",
        confidence: 0.91,
        severity: "critical",
        box: { x: 23, y: 81, w: 7, h: 8 },
        shadowLength: 2.4,
        estHeight: 0.9,
        estArea: 1.8,
        acousticProfile: "Hard geometric specular return with cylindrical shadow boundary",
        recoveryPriority: "P1 - Hazmat Quarantine",
        material: "Corroded carbon steel container with chemical residue risk",
        environmentalImpact: "Critical: Potential benthic ecotoxicity and heavy metal leaching",
        channel: "Port Swath",
        verificationStatus: "AI DETECTED",
        verifiedBy: null,
        verifiedAt: null,
        aiExplanation: {
          acousticIntensity: 96,
          shadowSignature: 92,
          geometryMatch: 91,
          textureMatch: 88,
          contextMatch: 88,
          overallConfidence: 91,
          text: "Cylindrical metallic specular highlight with hard shadow cutoff matching standard 55-gallon industrial chemical drum geometry."
        }
      },
      {
        id: "det-gn-04",
        label: "Unknown Acoustic Anomaly",
        category: "Acoustic Anomaly",
        confidence: 0.76,
        severity: "moderate",
        box: { x: 74, y: 72, w: 10, h: 10 },
        shadowLength: 1.5,
        estHeight: 0.5,
        estArea: 2.1,
        acousticProfile: "Low-amplitude specular highlight with diffuse boundary",
        recoveryPriority: "P3 - Secondary Survey Pass Required",
        material: "Unclassified seabed fixture or sediment mound",
        environmentalImpact: "Under evaluation; potential discarded ballast or inert boulder",
        channel: "Starboard Swath",
        verificationStatus: "AI DETECTED",
        verifiedBy: null,
        verifiedAt: null,
        aiExplanation: {
          acousticIntensity: 74,
          shadowSignature: 72,
          geometryMatch: 78,
          textureMatch: 76,
          contextMatch: 80,
          overallConfidence: 76,
          text: "Weak backscatter contrast exhibiting low shadow delineation; candidate object requires higher-frequency 900 kHz acoustic verification."
        }
      }
    ],
    bathymetryStats: {
      averageDepth: "38.5 m",
      seabedType: "Glacial Sand & Hard Rock Outcrop",
      waterTemp: "11.4 °C",
      salinity: "34.8 PSU",
      swathAreaCovered: "0.85 km²",
      turbidity: "1.2 NTU"
    }
  },
  {
    id: "mission-cargo-drums",
    name: "Mission Delta-719: Industrial Channel Subsea Debris Survey",
    code: "MG-719-GOM",
    targetType: "Industrial Debris & Hazardous Chemical Drums",
    image: "/assets/sonar/dataset_cargo_drums.jpg",
    location: "Mississippi Canyon / Northern Gulf Continental Shelf",
    coordinates: { lat: 28.587, lon: -89.239 },
    coordsFormatted: "28° 35' 12\" N, 89° 14' 22\" W",
    depth: 64.2,
    altitude: 12.0,
    swathWidth: 150, // meters
    frequency: "900 kHz High-Res",
    towSpeed: 3.5,
    surveyDate: "2026-05-15 14:32 UTC",
    vessel: "Survey Vessel 'GeoTracer' (Towfish Orion-II)",
    operator: "Coastal Environmental Protection & Navigation Directorate",
    status: "HAZARDOUS MATERIAL ALERT",
    threatLevel: "critical",
    summary: "Discovered a 20ft submerged cargo container and an adjacent cluster of 55-gallon industrial metal drums resting in soft sediment. Potential toxic chemical leak or corrosion hazard in proximity to commercial shipping lanes.",
    detections: [
      {
        id: "det-cd-01",
        label: "Submerged ISO Shipping Container",
        category: "Lost Cargo",
        confidence: 0.99,
        severity: "high",
        box: { x: 14, y: 37, w: 18, h: 26 },
        shadowLength: 14.8,
        estHeight: 2.59,
        estArea: 14.8,
        dimensions: "6.05m x 2.44m x 2.59m",
        acousticProfile: "Sharp rectangular specular face with prominent shadow boundary",
        recoveryPriority: "P1 - Navigational Hazard & Structural Assessment",
        material: "Corten Steel / Corrugated Alloy",
        environmentalImpact: "High: Structural navigational obstruction, potential contents hazard",
        channel: "Port Swath (45m slant range)",
        verificationStatus: "AI DETECTED",
        verifiedBy: null,
        verifiedAt: null,
        aiExplanation: {
          acousticIntensity: 98,
          shadowSignature: 99,
          geometryMatch: 99,
          textureMatch: 97,
          contextMatch: 96,
          overallConfidence: 99,
          text: "High-specularity planar wall return casting an extensive 14.8m shadow with sharp right-angle vertices characteristic of an ISO container."
        }
      },
      {
        id: "det-cd-02",
        label: "Hazardous Chemical Drum Cluster",
        category: "Hazardous Containers",
        confidence: 0.95,
        severity: "critical",
        box: { x: 37, y: 41, w: 8, h: 18 },
        shadowLength: 3.8,
        estHeight: 0.88,
        estArea: 4.5,
        acousticProfile: "High intensity multi-point specular array with aligned shadows",
        recoveryPriority: "P1 - Critical Hazmat Quarantine & ROV Sampling",
        material: "Carbon Steel Drums (Corroding)",
        environmentalImpact: "Critical: Potential chemical/petrochemical leakage risk into benthic food web",
        channel: "Port Swath (18m slant range)",
        verificationStatus: "AI DETECTED",
        verifiedBy: null,
        verifiedAt: null,
        aiExplanation: {
          acousticIntensity: 97,
          shadowSignature: 94,
          geometryMatch: 95,
          textureMatch: 93,
          contextMatch: 96,
          overallConfidence: 95,
          text: "Array of five contiguous cylindrical returns exhibiting uniform spacing and parallel trailing acoustic shadow projections."
        }
      },
      {
        id: "det-cd-03",
        label: "Subsea Pipeline / Cable Scour Anomaly",
        category: "Infrastructure",
        confidence: 0.91,
        severity: "moderate",
        box: { x: 63, y: 52, w: 5, h: 6 },
        shadowLength: 1.2,
        estHeight: 0.35,
        estArea: 1.8,
        acousticProfile: "Linear acoustic shadow with low specular lip",
        recoveryPriority: "P3 - Monitor during next scheduled maintenance pass",
        material: "Submerged Concrete Mattress / Scour Depression",
        environmentalImpact: "Low: Localized seafloor sediment drift",
        channel: "Starboard Swath",
        verificationStatus: "AI DETECTED",
        verifiedBy: null,
        verifiedAt: null,
        aiExplanation: {
          acousticIntensity: 89,
          shadowSignature: 91,
          geometryMatch: 92,
          textureMatch: 88,
          contextMatch: 95,
          overallConfidence: 91,
          text: "Linear feature matching charted subsea utility corridor with localized hydrodynamic sediment scouring."
        }
      }
    ],
    bathymetryStats: {
      averageDepth: "64.2 m",
      seabedType: "Fine Silt & Sand Ripples",
      waterTemp: "18.2 °C",
      salinity: "36.2 PSU",
      swathAreaCovered: "1.42 km²",
      turbidity: "0.8 NTU"
    }
  },
  {
    id: "mission-shipwreck",
    name: "Mission Echo-883: Dover Strait Cultural Heritage & Hazard Inspection",
    code: "MG-883-EC",
    targetType: "Sunken Vessel Wreck & Heavy Marine Debris",
    image: "/assets/sonar/dataset_shipwreck.jpg",
    location: "Dover Strait / English Channel Traffic Separation Zone",
    coordinates: { lat: 50.248, lon: -1.802 },
    coordsFormatted: "50° 14' 56\" N, 01° 48' 10\" W",
    depth: 42.0,
    altitude: 12.0,
    swathWidth: 150,
    frequency: "410 kHz Hydrographic Chirp",
    towSpeed: 3.8,
    surveyDate: "2026-04-22 14:32 UTC",
    vessel: "Survey Vessel 'MV Explorer' (EdgeTech 4200 SSS)",
    operator: "Maritime Hydrographic Service & Underwater Archaeology",
    status: "NAVIGATIONAL HAZARD MONITORED",
    threatLevel: "warning",
    summary: "High-resolution side-scan acoustic inspection of a 34-meter wooden-iron vessel hull resting upright on chalk/sand seafloor. Heavy structural debris field with scattered anchors, masts, and fallen iron framework extending 60m westward.",
    detections: [
      {
        id: "det-sw-01",
        label: "Sunken Vessel Hull Structure (34m)",
        category: "Shipwreck / Navigation Hazard",
        confidence: 0.98,
        severity: "warning",
        box: { x: 23, y: 15, w: 68, h: 68 },
        shadowLength: 22.4,
        estHeight: 4.8,
        estArea: 285.0,
        dimensions: "34.2m Length x 7.8m Beam x 4.8m Height",
        acousticProfile: "Complex high-relief backscatter with ribbing and extensive shadow profile",
        recoveryPriority: "P2 - Navigational Charting & Protected Heritage Site",
        material: "Oak Timber Framing & Wrought Iron Reinforcement",
        environmentalImpact: "Moderate: Artificial reef habitat with snag hazards for commercial bottom trawlers",
        channel: "Port & Starboard (Across Nadir Line)",
        verificationStatus: "AI DETECTED",
        verifiedBy: null,
        verifiedAt: null,
        aiExplanation: {
          acousticIntensity: 98,
          shadowSignature: 99,
          geometryMatch: 97,
          textureMatch: 96,
          contextMatch: 98,
          overallConfidence: 98,
          text: "Distinctive hydrodynamic bow-to-stern vessel geometry, rib frames, and large 22.4m shadow profile verifying 4.8m vertical mast elevation."
        }
      },
      {
        id: "det-sw-02",
        label: "Stockless Admiralty Anchor & Chain",
        category: "Heavy Maritime Debris",
        confidence: 0.94,
        severity: "low",
        box: { x: 26, y: 50, w: 5, h: 8 },
        shadowLength: 2.9,
        estHeight: 1.1,
        estArea: 2.4,
        acousticProfile: "Distinctive cross-shank specular highlight with double flukes",
        recoveryPriority: "P3 - Historical Documentation",
        material: "Cast Iron",
        environmentalImpact: "Minimal: Stable inert seabed fixture",
        channel: "Port Swath",
        verificationStatus: "AI DETECTED",
        verifiedBy: null,
        verifiedAt: null,
        aiExplanation: {
          acousticIntensity: 95,
          shadowSignature: 92,
          geometryMatch: 96,
          textureMatch: 90,
          contextMatch: 97,
          overallConfidence: 94,
          text: "High-density cross-shank acoustic return with paired fluke shadows consistent with heavy maritime cast-iron ground tackle."
        }
      },
      {
        id: "det-sw-03",
        label: "Detached Mast & Structural Timber Scatter",
        category: "Structural Debris Field",
        confidence: 0.88,
        severity: "moderate",
        box: { x: 12, y: 35, w: 9, h: 14 },
        shadowLength: 4.2,
        estHeight: 0.9,
        estArea: 8.7,
        acousticProfile: "Elongated linear specular traces with narrow shadows",
        recoveryPriority: "P3 - Demarcate in Notice to Mariners",
        material: "Hardwood & Metal Fasteners",
        environmentalImpact: "Low: Trawl gear obstruction",
        channel: "Port Swath",
        verificationStatus: "AI DETECTED",
        verifiedBy: null,
        verifiedAt: null,
        aiExplanation: {
          acousticIntensity: 87,
          shadowSignature: 89,
          geometryMatch: 86,
          textureMatch: 88,
          contextMatch: 90,
          overallConfidence: 88,
          text: "Elongated linear acoustic return casting a narrow uniform shadow consistent with a detached spar or timber beam."
        }
      }
    ],
    bathymetryStats: {
      averageDepth: "42.0 m",
      seabedType: "Sand Waves & Chalk Bedrock",
      waterTemp: "12.8 °C",
      salinity: "35.1 PSU",
      swathAreaCovered: "1.15 km²",
      turbidity: "1.5 NTU"
    }
  }
];

export const COLOR_PALETTES = [
  { id: "amber", name: "Amber Sonar", desc: "Classic golden-bronze acoustic hydrophone palette", badge: "Standard" },
  { id: "oceanic", name: "Deep Oceanic Cyan", desc: "High dynamic-range deep sea luminescence", badge: "Contrast" },
  { id: "phosphor", name: "Emerald Phosphor", desc: "Military & hydrographic night-vision display", badge: "Acoustic" },
  { id: "copper", name: "Thermal Copper", desc: "Thermal-gradient enhancement for weak acoustic returns", badge: "Shadow Focus" },
  { id: "grayscale", name: "Hydro Monochromatic", desc: "Standard calibrated reflectance grayscale", badge: "Calibrated" }
];

export const USER_PERSONAS = [
  {
    id: "researcher",
    name: "Marine Researcher",
    org: "Oceanographic Institute",
    focus: "Seabed ecology, benthic habitat degradation, acoustic biomass metrics",
    primaryMetric: "Benthic Health Index: 68.4% (Moderate Disturbance)"
  },
  {
    id: "conservation",
    name: "Conservation Team",
    org: "Global Marine Protection Alliance",
    focus: "Ghost gear recovery, plastic pollution density, wildlife entrapment mitigation",
    primaryMetric: "Derelict Net Mass: 1,420 kg (P1 Target)"
  },
  {
    id: "surveyor",
    name: "Hydrographic Survey Engineer",
    org: "DeepSea Geosciences Ltd.",
    focus: "Subsea infrastructure clearance, acoustic shadow photogrammetry, swath calibration",
    primaryMetric: "Survey Swath Coverage: 99.4% Validated"
  },
  {
    id: "authority",
    name: "Coastal & Harbor Authority",
    org: "Maritime Safety & Navigational Directorate",
    focus: "Navigational hazard warnings, illegal dumping enforcement, maritime clearance",
    primaryMetric: "Navigational Obstruction Score: Class II"
  }
];
