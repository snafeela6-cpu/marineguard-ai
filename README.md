# MarineGuard AI
> **Intelligent Underwater Detection & Marine Monitoring**

MarineGuard AI is an autonomous hydrographic intelligence platform designed to analyze high-resolution Side-Scan Sonar (SSS) imagery to automatically detect, classify, measure, and monitor marine debris, lost fishing gear, hazardous containers, and submerged navigational hazards.

---

## 🌊 System Architecture & Modules

### 1. Dual-Swath Acoustic Waterfall Analyzer
- **Port & Starboard Hydrophone Visualization**: Interactive canvas rendering with acoustic nadir track demarcation and calibrated range rulers.
- **Dynamic Spectral Palettes**:
  - *Amber Sonar* (Standard golden-bronze acoustic hydrophone mapping)
  - *Deep Oceanic Cyan* (High dynamic-range deep sea luminescence)
  - *Emerald Phosphor* (Military & hydrographic night-vision display)
  - *Thermal Copper* (Thermal gradient enhancement for subtle acoustic returns)
  - *Hydro Monochromatic* (Calibrated grayscale reflectivity)
- **Live Waterfall Simulation Mode**: Continuous acoustic ping sweep simulating real-time AUV / towfish acquisition with line-by-line decoding.
- **Synthesized Acoustic Audio Engine**: Web Audio API-powered sonar chirp pings and anomaly alert chirps with instant mute/unmute control.

### 2. Deep Learning Neural Sonar-Net v4.2
- **Acoustic Shadow Photogrammetry**: Automated calculation of submerged object elevation above the seafloor using hydrographic shadow geometry:
  $$\text{Object Height } (h) = \frac{H \cdot L_s}{R + L_s}$$
  *(where $H$ = Towfish Altitude, $L_s$ = Acoustic Shadow Length, $R$ = Slant Range)*
- **Interactive ROI (Region of Interest) Inference**: Users can draw custom bounding boxes anywhere on the sonar canvas to trigger real-time neural inference and acoustic shadow edge detection.
- **Dynamic AI Confidence Filtering**: Interactive threshold slider updating bounding boxes and threat registers in real time.

### 3. Geospatial Bathymetric Survey Tracker
- **Autonomous AUV "Nautilus-X4" Simulation**: Live vehicle navigation along lawnmower survey transects with heading vectors, ping cones, and swath coverage ribbons.
- **Bathymetric Depth Contours**: Isobath gradient layers (-20m to -150m) with nautical coordinate graticules.
- **Geolocated Anomaly Markers**: Interactive pins filtered by debris classification (Ghost Gear, Marine Plastics, Hazardous Drums, Cargo Containers, Shipwrecks).

### 4. Environmental Impact & Recovery Analytics
- **Seabed Pollution Index (SPI)**: Quantitative benthic contamination scoring based on debris volume and chemical threat tier.
- **Acoustic Classification Composition**: Category distribution meters and threat severity breakdown.
- **ROV Recovery Action Priority Matrix**: Tiered intervention protocol (P1 Immediate ROV Extraction, P2 Scheduled Salvage, P3 Navigational Notice).

### 5. Hydrographic Cockpit & Transducer Diagnostics
- **Attitude & Towfish Gyroscope**: Real-time heading (compass dial), pitch, and roll telemetry.
- **Dual-Chirp Transducer Status**: Signal-to-Noise Ratio (SNR) monitoring for 450 kHz and 900 kHz channels.
- **Oceanographic Water Column & SVP**: Sound velocity profiling ($c = 1,492.4\text{ m/s}$), salinity, temperature, and hydrostatic pressure.

### 6. Official Inspection Report & Data Export
- **Executive Inspection Summary**: Printable / PDF-ready formal hydrographic report conforming to IHO S-44 standards.
- **Direct GeoJSON Export**: Compliant GIS vector feature layers with acoustic attributes.
- **CSV Hydrographic Log**: Full tabular register of all detected targets and photogrammetric measurements.
- **Custom Sonar Ingestion**: Drag-and-drop tool for analyzing external `.XTF`, `.JSF`, GeoTIFF, and high-resolution sonar imagery.

---

## 👥 Tailored User Personas

1. **Marine Researchers**: Benthic habitat degradation assessment, substrate anomaly mapping, and acoustic biomass metrics.
2. **Marine Conservation Teams**: Derelict ghost fishing gear recovery, microplastic mitigation, and wildlife entanglement risk zones.
3. **Hydrographic Survey Engineers**: Subsea infrastructure clearance, acoustic shadow photogrammetry, and bathymetric swath calibration.
4. **Coastal & Harbor Authorities**: Navigational obstacle tracking, illegal dumping enforcement, and Notice to Mariners demarcation.

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build
```

Open [http://localhost:5173](http://localhost:5173) in your browser to interact with the platform.
