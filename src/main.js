// MarineGuard AI - Main Application Controller (Phase 2 Polished)
import { MISSION_DATASETS, USER_PERSONAS } from './data/datasets.js';
import { SonarViewer } from './components/sonarViewer.js';
import { BathymetricMapViewer } from './components/mapViewer.js';
import { sonarAudio } from './components/audioSonar.js';
import { ReportGenerator } from './components/reportGenerator.js';
import { SonarIngestController } from './components/sonarIngest.js';

class MarineGuardApp {
  constructor() {
    this.currentMissionIndex = 0;
    this.currentMission = MISSION_DATASETS[0];
    this.selectedDetection = this.currentMission.detections[0];

    this.sonarViewer = null;
    this.mapViewer = null;
    this.sonarIngest = null;
    this.isAnalyzing = false;

    this.init();
  }

  init() {
    this.initMissionCommandBar();
    this.initSonarViewer();
    this.initMapViewer();
    this.initSonarIngest();
    this.initNavigation();
    this.initToolbarControls();
    this.initPersonaSelector();
    this.initModals();
    this.initAudio();
    this.initAiAnalysisWorkflow();
    this.initVerificationWorkflow();

    // Initial population
    this.updateInspectorSidebar(this.selectedDetection);
    this.renderDetectionsList(false);
    this.updateEnvironmentalMetrics();
  }

  /* ==========================================================================
     MISSION COMMAND BAR & LIVE UTC CLOCK
     ========================================================================== */
  initMissionCommandBar() {
    // 1. Real-time UTC Timestamp updater
    const clockEl = document.getElementById('cmd-live-clock');
    const updateClock = () => {
      if (!clockEl) return;
      const now = new Date();
      const iso = now.toISOString().replace('T', ' ').substring(0, 19);
      clockEl.textContent = `${iso} UTC`;
    };
    updateClock();
    setInterval(updateClock, 1000);

    // 2. Initial Mission Command sync
    this.updateMissionCommandStrip(this.currentMission);
  }

  updateMissionCommandStrip(mission) {
    const nameEl = document.getElementById('cmd-mission-name');
    const auvEl = document.getElementById('cmd-auv');
    const depthEl = document.getElementById('cmd-depth');
    const speedEl = document.getElementById('cmd-speed');
    const coverageEl = document.getElementById('cmd-coverage');
    const sonarEl = document.getElementById('cmd-sonar');
    const aiEl = document.getElementById('cmd-ai');
    const qualityEl = document.getElementById('cmd-quality');

    if (!nameEl) return;

    if (mission.id === 'mission-ghost-net') {
      nameEl.textContent = 'MG-402 | North Sea Survey';
      if (auvEl) auvEl.textContent = 'NAUTILUS-04';
      if (depthEl) depthEl.textContent = '42.8 m';
      if (speedEl) speedEl.textContent = '3.2 kn';
      if (coverageEl) coverageEl.textContent = '3.42 km²';
      if (sonarEl) sonarEl.textContent = '100 kHz';
      if (aiEl) aiEl.textContent = 'ONLINE';
      if (qualityEl) qualityEl.textContent = '94%';
    } else if (mission.id === 'mission-cargo-drums') {
      nameEl.textContent = 'MG-719 | Gulf Deepwater Transect';
      if (auvEl) auvEl.textContent = 'ORION-II';
      if (depthEl) depthEl.textContent = '64.2 m';
      if (speedEl) speedEl.textContent = '3.5 kn';
      if (coverageEl) coverageEl.textContent = '4.15 km²';
      if (sonarEl) sonarEl.textContent = '900 kHz';
      if (aiEl) aiEl.textContent = 'ONLINE';
      if (qualityEl) qualityEl.textContent = '96%';
    } else if (mission.id === 'mission-shipwreck') {
      nameEl.textContent = 'MG-883 | Dover Strait Survey';
      if (auvEl) auvEl.textContent = 'EXPLORER-X';
      if (depthEl) depthEl.textContent = '42.0 m';
      if (speedEl) speedEl.textContent = '3.8 kn';
      if (coverageEl) coverageEl.textContent = '2.85 km²';
      if (sonarEl) sonarEl.textContent = '410 kHz';
      if (aiEl) aiEl.textContent = 'ONLINE';
      if (qualityEl) qualityEl.textContent = '98%';
    } else {
      nameEl.textContent = `${mission.code || 'CUSTOM'} | ${mission.name.split(':')[0]}`;
      if (auvEl) auvEl.textContent = 'NAUTILUS-04';
      if (depthEl) depthEl.textContent = `${mission.depth || 45.0} m`;
      if (speedEl) speedEl.textContent = `${mission.towSpeed || 3.2} kn`;
      if (coverageEl) coverageEl.textContent = '1.20 km²';
      if (sonarEl) sonarEl.textContent = mission.frequency ? mission.frequency.split(' ')[0] : '450 kHz';
      if (aiEl) aiEl.textContent = 'ONLINE';
      if (qualityEl) qualityEl.textContent = '92%';
    }
  }

  /* ==========================================================================
     SONAR & MAP VIEWERS INITIALIZATION WITH SYNCHRONIZATION
     ========================================================================== */
  initSonarViewer() {
    const canvas = document.getElementById('sonar-canvas');
    this.sonarViewer = new SonarViewer(canvas, {
      onSelectDetection: (det) => {
        this.selectedDetection = det;
        if (this.mapViewer) {
          this.mapViewer.setSelectedDetection(det.id);
        }
        this.updateInspectorSidebar(det);
        this.highlightDetectionCard(det.id);
      },
      onNewDetectionAdded: (newDet) => {
        this.selectedDetection = newDet;
        if (this.mapViewer) {
          this.mapViewer.setSelectedDetection(newDet.id);
        }
        this.updateInspectorSidebar(newDet);
        this.renderDetectionsList(false);
      }
    });

    this.sonarViewer.loadDataset(this.currentMission);
  }

  initMapViewer() {
    const canvas = document.getElementById('map-canvas');
    this.mapViewer = new BathymetricMapViewer(canvas, {
      missions: MISSION_DATASETS,
      onSelectMission: (mission) => {
        this.switchMission(mission.id);
        this.updateMapMissionCard(mission);
      },
      onSelectDetection: (det) => {
        // Map synchronization: clicking detection on map selects it in Sonar view & inspector
        this.selectedDetection = det;
        if (this.sonarViewer) {
          this.sonarViewer.selectedDetectionId = det.id;
          this.sonarViewer.render();
        }
        this.updateInspectorSidebar(det);
        this.highlightDetectionCard(det.id);
      }
    });
    this.mapViewer.setActiveMission(this.currentMission);
    this.mapViewer.setSelectedDetection(this.selectedDetection ? this.selectedDetection.id : null);
    this.updateMapMissionCard(this.currentMission);
  }

  /* ==========================================================================
     SONAR ANALYSIS — INGEST SONAR DATA WORKFLOW CONTROLLER
     ========================================================================== */
  initSonarIngest() {
    this.sonarIngest = new SonarIngestController({
      onIngestionComplete: (ingestState) => {
        this.handleIngestionCompleted(ingestState);
      },
      onProceedToAi: (ingestState) => {
        this.navigateToAiDetection(ingestState);
      },
      onFileChanged: (ingestState) => {
        this.syncActiveIngestBanner(ingestState);
      }
    });

    // Jump from active banner in AI view back to Sonar Analysis ingest view
    const btnReopenIngest = document.getElementById('btn-reopen-ingest');
    if (btnReopenIngest) {
      btnReopenIngest.addEventListener('click', () => {
        sonarAudio.playClick();
        const tabIngest = document.getElementById('tab-ingest');
        if (tabIngest) tabIngest.click();
      });
    }

    // Initial sync of banner
    this.syncActiveIngestBanner(this.sonarIngest.state);
  }

  syncActiveIngestBanner(ingestState) {
    if (!ingestState) return;
    const bannerName = document.getElementById('banner-survey-name');
    const bannerFile = document.getElementById('banner-survey-file');
    const bannerSize = document.getElementById('banner-survey-size');
    const bannerPill = document.getElementById('banner-survey-status-pill');

    if (bannerName) bannerName.textContent = ingestState.surveyName;
    if (bannerFile) bannerFile.textContent = ingestState.fileName;
    if (bannerSize) bannerSize.textContent = ingestState.fileSize;

    if (bannerPill) {
      if (ingestState.status === 'completed' || ingestState.isIngested) {
        bannerPill.textContent = 'SONAR DATA READY';
        bannerPill.style.background = 'rgba(16, 185, 129, 0.12)';
        bannerPill.style.color = 'var(--color-status-emerald)';
        bannerPill.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      } else {
        bannerPill.textContent = 'INGESTION ACTIVE';
        bannerPill.style.background = 'rgba(56, 189, 248, 0.1)';
        bannerPill.style.color = 'var(--color-nav-cyan)';
        bannerPill.style.borderColor = 'rgba(56, 189, 248, 0.25)';
      }
    }
  }

  handleIngestionCompleted(ingestState) {
    this.syncActiveIngestBanner(ingestState);

    // Update Mission Command Strip with active ingested survey
    const cmdName = document.getElementById('cmd-mission-name');
    const cmdSonar = document.getElementById('cmd-sonar');
    const cmdCoverage = document.getElementById('cmd-coverage');
    const cmdQuality = document.getElementById('cmd-quality');

    if (cmdName) cmdName.textContent = `${ingestState.surveyName} | SSS Swath Active`;
    if (cmdSonar) cmdSonar.textContent = '450 kHz SSS';
    if (cmdCoverage) cmdCoverage.textContent = ingestState.metrics.surveyLength;
    if (cmdQuality) cmdQuality.textContent = '96%';

    // If custom image file was selected and loaded, pass to sonarViewer
    if (ingestState.customImageElement && this.sonarViewer) {
      const customDs = {
        id: "mission-custom-ingest",
        name: `${ingestState.surveyName}: Ingested Sonar Data`,
        code: "INGEST-SSS",
        targetType: "Side-Scan Sonar Targets",
        image: ingestState.customImageElement.src,
        location: "Survey Transect Corridor",
        coordinates: { lat: 54.705, lon: 2.262 },
        coordsFormatted: "54° 42' 18\" N, 02° 15' 44\" E",
        depth: 45.0,
        altitude: 8.5,
        swathWidth: 100,
        frequency: "450 kHz Dual-Chirp",
        towSpeed: 3.2,
        surveyDate: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
        vessel: "R/V Ocean Sentinel (AUV Nautilus-X4)",
        operator: "Hydrographic Survey Unit",
        status: "INGESTION VERIFIED",
        threatLevel: "critical",
        summary: `Ingested side-scan survey file ${ingestState.fileName} (${ingestState.fileSize}). Calibrated 450 kHz acoustic backscatter swath.`,
        detections: this.currentMission.detections,
        bathymetryStats: this.currentMission.bathymetryStats
      };
      this.sonarViewer.loadDataset(customDs);
    }
  }

  navigateToAiDetection(ingestState) {
    this.syncActiveIngestBanner(ingestState);
    const tabSonar = document.getElementById('tab-sonar');
    if (tabSonar) {
      tabSonar.click();
    }
  }

  initNavigation() {
    const navButtons = document.querySelectorAll('.nav-tab-btn');
    const viewPanels = document.querySelectorAll('.view-panel');

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        sonarAudio.playClick();
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const targetViewId = btn.getAttribute('data-view');
        viewPanels.forEach(p => p.classList.remove('active'));
        const activePanel = document.getElementById(targetViewId);
        if (activePanel) {
          activePanel.classList.add('active');
        }

        // Trigger resize on canvas when made visible
        if (targetViewId === 'view-ingest' && this.sonarIngest) {
          setTimeout(() => {
            this.sonarIngest.resizeCanvas();
            this.sonarIngest.drawAuthenticSonarPreview();
          }, 50);
        } else if (targetViewId === 'view-sonar' && this.sonarViewer) {
          setTimeout(() => {
            this.sonarViewer.resizeCanvas();
            this.sonarViewer.render();
          }, 50);
        } else if (targetViewId === 'view-map' && this.mapViewer) {
          setTimeout(() => {
            this.mapViewer.resize();
            this.mapViewer.render();
          }, 50);
        }
      });
    });

    // Jump from Map View to Sonar Vision
    const btnJump = document.getElementById('btn-jump-to-sonar');
    if (btnJump) {
      btnJump.addEventListener('click', () => {
        document.getElementById('tab-sonar').click();
      });
    }
  }

  initToolbarControls() {
    // Dataset Selector
    const datasetSelector = document.getElementById('dataset-selector');
    datasetSelector.addEventListener('change', (e) => {
      this.switchMission(e.target.value);
    });

    // Palette Buttons
    const paletteButtons = document.querySelectorAll('.palette-btn');
    paletteButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        sonarAudio.playClick();
        paletteButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const paletteId = btn.getAttribute('data-palette');
        this.sonarViewer.setPalette(paletteId);
      });
    });

    // Confidence Slider (Synchronizes Sonar, Map, List, and Analytics simultaneously)
    const slider = document.getElementById('confidence-slider');
    const sliderVal = document.getElementById('confidence-val');
    slider.addEventListener('input', (e) => {
      const val = e.target.value;
      sliderVal.textContent = `${Math.round(val * 100)}%`;
      this.sonarViewer.setConfidenceThreshold(val);
      if (this.mapViewer) {
        this.mapViewer.setConfidenceThreshold(val);
      }
      this.renderDetectionsList(false);
      this.updateAnalyticsCounts();
    });

    // Feature Toggles
    const btnBoxes = document.getElementById('btn-toggle-boxes');
    btnBoxes.addEventListener('click', () => {
      const active = btnBoxes.classList.toggle('active');
      this.sonarViewer.toggleBoundingBoxes(active);
    });

    const btnShadows = document.getElementById('btn-toggle-shadows');
    btnShadows.addEventListener('click', () => {
      const active = btnShadows.classList.toggle('active');
      this.sonarViewer.toggleShadowVectors(active);
    });

    const btnRoi = document.getElementById('btn-draw-roi');
    btnRoi.addEventListener('click', () => {
      const active = btnRoi.classList.toggle('active');
      this.sonarViewer.toggleRoiMode(active);
    });

    const btnLiveScan = document.getElementById('btn-live-scan');
    btnLiveScan.addEventListener('click', () => {
      const active = btnLiveScan.classList.toggle('active');
      this.sonarViewer.toggleLiveScan(active);
      btnLiveScan.innerHTML = active
        ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> Stop Sweep`
        : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Live Sweep`;
    });

    // Float Zoom Controls
    document.getElementById('btn-zoom-in').addEventListener('click', () => {
      sonarAudio.playClick();
      this.sonarViewer.zoomIn();
    });

    document.getElementById('btn-zoom-out').addEventListener('click', () => {
      sonarAudio.playClick();
      this.sonarViewer.zoomOut();
    });

    document.getElementById('btn-reset-view').addEventListener('click', () => {
      sonarAudio.playClick();
      this.sonarViewer.resetView();
    });

    // Map Category Filter Buttons
    const mapFilters = document.querySelectorAll('.map-filter-btn');
    mapFilters.forEach(btn => {
      btn.addEventListener('click', () => {
        sonarAudio.playClick();
        mapFilters.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        this.mapViewer.setFilter(filter);
      });
    });
  }

  initPersonaSelector() {
    const selector = document.getElementById('persona-selector');
    const banner = document.getElementById('persona-banner-text');

    selector.addEventListener('change', (e) => {
      sonarAudio.playClick();
      const val = e.target.value;
      const persona = USER_PERSONAS.find(p => p.id === val);
      if (persona && banner) {
        banner.innerHTML = `OPERATOR: <strong>${persona.name}</strong> &bull; ${persona.primaryMetric}`;
      }
    });
  }

  initAudio() {
    const audioBtn = document.getElementById('btn-audio-toggle');
    const iconOn = document.getElementById('icon-audio-on');
    const iconOff = document.getElementById('icon-audio-off');

    audioBtn.addEventListener('click', () => {
      const isMuted = sonarAudio.toggleMute();
      if (isMuted) {
        audioBtn.classList.remove('active');
        iconOn.style.display = 'none';
        iconOff.style.display = 'block';
      } else {
        audioBtn.classList.add('active');
        iconOn.style.display = 'block';
        iconOff.style.display = 'none';
        sonarAudio.playSonarPing();
      }
    });
  }

  /* ==========================================================================
     PHASE 2: REALISTIC 10-STEP SONAR AI ANALYSIS DEMO WORKFLOW
     ========================================================================== */
  initAiAnalysisWorkflow() {
    const btnStart = document.getElementById('btn-start-ai-analysis');
    const modalAnalysis = document.getElementById('modal-ai-analysis');
    const btnCloseModal = document.getElementById('btn-close-analysis-modal');
    const btnViewDetections = document.getElementById('btn-view-revealed-detections');

    const steps = [
      "01 — Loading sonar dataset",
      "02 — Validating navigation metadata",
      "03 — Removing acoustic noise",
      "04 — Normalizing sonar intensity",
      "05 — Extracting acoustic features",
      "06 — Detecting candidate objects",
      "07 — Classifying objects",
      "08 — Calculating confidence",
      "09 — Generating risk assessment",
      "10 — Analysis complete"
    ];

    btnStart.addEventListener('click', () => {
      if (this.isAnalyzing) return;
      this.isAnalyzing = true;
      sonarAudio.playSonarPing();

      // Reset modal UI
      modalAnalysis.classList.add('open');
      btnCloseModal.style.display = 'none';
      document.getElementById('analysis-complete-card').style.display = 'none';
      
      const container = document.getElementById('analysis-steps-container');
      container.innerHTML = '';
      steps.forEach((step, idx) => {
        const item = document.createElement('div');
        item.className = 'analysis-step-item';
        item.id = `analysis-step-${idx}`;
        item.innerHTML = `
          <span>${step}</span>
          <span class="step-status-icon" id="step-icon-${idx}">
            <span style="width:4px; height:4px; border-radius:50%; background:#4b6282;"></span>
          </span>
        `;
        container.appendChild(item);
      });

      // Run 10-step progress sequence
      let currentStep = 0;
      const totalSteps = steps.length;
      const progressBar = document.getElementById('analysis-progress-bar');
      const stepTitle = document.getElementById('analysis-step-title');
      const progressPct = document.getElementById('analysis-progress-pct');

      const stepInterval = setInterval(() => {
        // Mark previous step as done
        if (currentStep > 0) {
          const prevItem = document.getElementById(`analysis-step-${currentStep - 1}`);
          const prevIcon = document.getElementById(`step-icon-${currentStep - 1}`);
          if (prevItem) {
            prevItem.className = 'analysis-step-item done';
            prevIcon.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
          }
        }

        if (currentStep < totalSteps) {
          // Activate current step
          const curItem = document.getElementById(`analysis-step-${currentStep}`);
          const curIcon = document.getElementById(`step-icon-${currentStep}`);
          if (curItem) {
            curItem.className = 'analysis-step-item active';
            curIcon.innerHTML = `<span class="status-pulse-dot" style="background:#38bdf8; width:5px; height:5px;"></span>`;
            stepTitle.textContent = steps[currentStep];
          }

          const pct = Math.round(((currentStep + 1) / totalSteps) * 100);
          progressBar.style.width = `${pct}%`;
          progressPct.textContent = `${pct}%`;

          // Subtle ping sound on step transition
          if (currentStep % 2 === 0) {
            sonarAudio.playClick();
          }

          currentStep++;
        } else {
          // Completed
          clearInterval(stepInterval);
          this.isAnalyzing = false;
          sonarAudio.playAnomalyAlert();

          // Show Analysis Complete Summary Card
          const completeCard = document.getElementById('analysis-complete-card');
          completeCard.style.display = 'block';
          btnCloseModal.style.display = 'flex';

          // Consistent demo values based on dataset
          const count = this.currentMission.detections.length;
          document.getElementById('metric-processed').textContent = `1 Swath GeoTIFF (24,800 pings)`;
          document.getElementById('metric-detected').textContent = `${count} Anomaly Clusters`;
          document.getElementById('metric-high-conf').textContent = `${count >= 4 ? count - 1 : count} Targets (≥88%)`;
          document.getElementById('metric-time').textContent = `1.84 s`;
        }
      }, 230);
    });

    btnCloseModal.addEventListener('click', () => {
      modalAnalysis.classList.remove('open');
    });

    // View Revealed Detections
    btnViewDetections.addEventListener('click', () => {
      sonarAudio.playClick();
      modalAnalysis.classList.remove('open');
      this.revealDetectionsProgressively();
    });
  }

  /* ==========================================================================
     PHASE 2: PROGRESSIVE DETECTION REVEAL WITH ANIMATION
     ========================================================================== */
  revealDetectionsProgressively() {
    const listContainer = document.getElementById('detection-items-list');
    listContainer.innerHTML = '';
    const visibleDets = this.sonarViewer.getAllDetections().filter(d => d.confidence >= this.sonarViewer.confidenceThreshold);

    document.getElementById('target-count-badge').textContent = `${visibleDets.length} DETECTIONS REVEALED`;

    visibleDets.forEach((det, idx) => {
      setTimeout(() => {
        const card = document.createElement('div');
        const isSelected = idx === 0;
        card.className = `detection-item-card reveal ${isSelected ? 'selected' : ''}`;
        card.id = `det-card-${det.id}`;

        const isVerified = det.verificationStatus === "VERIFIED BY HYDROGRAPHIC OPERATOR";

        card.innerHTML = `
          <div class="det-item-info">
            <div class="det-item-name" style="display:flex; align-items:center; gap:6px;">
              <span>${det.label}</span>
              ${isVerified ? `<span style="color:#10b981; font-size:10px;" title="Verified">✓</span>` : ''}
            </div>
            <div class="det-item-meta">${det.category} &bull; ${det.channel || 'Port Swath'}</div>
          </div>
          <div class="det-item-badge">${Math.round(det.confidence * 100)}%</div>
        `;

        card.addEventListener('click', () => {
          sonarAudio.playAnomalyAlert();
          this.selectedDetection = det;
          this.sonarViewer.selectedDetectionId = det.id;
          this.sonarViewer.render();
          if (this.mapViewer) {
            this.mapViewer.setSelectedDetection(det.id);
          }
          this.updateInspectorSidebar(det);
          this.highlightDetectionCard(det.id);
        });

        listContainer.appendChild(card);
        sonarAudio.playAnomalyAlert();

        // Select first detection when revealed
        if (idx === 0) {
          this.selectedDetection = det;
          this.sonarViewer.selectedDetectionId = det.id;
          this.sonarViewer.render();
          if (this.mapViewer) {
            this.mapViewer.setSelectedDetection(det.id);
          }
          this.updateInspectorSidebar(det);
        }
      }, idx * 220);
    });
  }

  /* ==========================================================================
     PHASE 2: HUMAN OPERATOR VERIFICATION WORKFLOW
     ========================================================================== */
  initVerificationWorkflow() {
    const btnVerify = document.getElementById('btn-verify-detection');
    const modalConfirm = document.getElementById('modal-confirm-verify');
    const btnCancel = document.getElementById('btn-cancel-verify');
    const btnClose = document.getElementById('btn-close-verify-modal');
    const btnConfirmAction = document.getElementById('btn-confirm-detection-action');

    btnVerify.addEventListener('click', () => {
      if (!this.selectedDetection) return;
      sonarAudio.playClick();
      document.getElementById('verify-modal-target-name').textContent = this.selectedDetection.label;
      document.getElementById('verify-modal-target-id').textContent = this.selectedDetection.id;
      modalConfirm.classList.add('open');
    });

    const closeModal = () => modalConfirm.classList.remove('open');
    btnCancel.addEventListener('click', closeModal);
    btnClose.addEventListener('click', closeModal);

    btnConfirmAction.addEventListener('click', () => {
      if (!this.selectedDetection) return;
      sonarAudio.playAnomalyAlert();

      // Update detection verification status
      this.selectedDetection.verificationStatus = "VERIFIED BY HYDROGRAPHIC OPERATOR";
      this.selectedDetection.verifiedAt = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
      this.selectedDetection.verifiedBy = "Hydrographic Operator #402";

      // Refresh inspector and detection cards
      this.updateInspectorSidebar(this.selectedDetection);
      this.renderDetectionsList(false);
      closeModal();
    });
  }

  /* ==========================================================================
     INSPECTOR SIDEBAR & DETAILED AI EXPLANATION UPDATE
     ========================================================================== */
  updateInspectorSidebar(det) {
    if (!det) return;

    const labelEl = document.getElementById('target-label');
    const idEl = document.getElementById('target-id');
    const catEl = document.getElementById('target-category');
    const threatPill = document.getElementById('sidebar-threat-pill');
    const cardEl = document.getElementById('inspector-card');

    const confEl = document.getElementById('target-conf');
    const shadowEl = document.getElementById('target-shadow');
    const heightEl = document.getElementById('target-height');
    const areaEl = document.getElementById('target-area');

    const formAlt = document.getElementById('formula-alt');
    const formShadow = document.getElementById('formula-shadow');

    const matEl = document.getElementById('target-material');
    const impactEl = document.getElementById('target-impact');
    const recoveryEl = document.getElementById('target-recovery');

    labelEl.textContent = det.label;
    idEl.textContent = `TARGET #${det.id}`;
    catEl.textContent = det.category.toUpperCase();

    // Style card and threat badge
    cardEl.className = `inspector-card ${det.severity || 'high'}`;
    catEl.className = `target-category-badge badge-${det.severity || 'high'}`;
    threatPill.className = `badge-${det.severity || 'high'}`;
    threatPill.textContent = (det.severity || 'CRITICAL').toUpperCase();

    confEl.textContent = `${Math.round(det.confidence * 100)}%`;
    shadowEl.textContent = det.shadowLength ? `${det.shadowLength} m` : 'N/A';
    heightEl.textContent = det.estHeight ? `${det.estHeight} m` : 'N/A';
    areaEl.textContent = `${det.estArea || 12.0} m²`;

    formAlt.textContent = `${this.currentMission.altitude}m`;
    formShadow.textContent = det.shadowLength ? `${det.shadowLength}m` : 'N/A';

    matEl.textContent = det.material || 'Synthetic / Anthropogenic Material';
    impactEl.textContent = det.environmentalImpact || 'Active threat to marine habitat and navigation';
    recoveryEl.textContent = det.recoveryPriority || 'P2 - Scheduled Recovery';

    // Verification Status Row
    const verifyStatusEl = document.getElementById('target-verify-status');
    const verifyBtn = document.getElementById('btn-verify-detection');
    const isVerified = det.verificationStatus === "VERIFIED BY HYDROGRAPHIC OPERATOR";

    if (isVerified) {
      verifyStatusEl.style.color = '#10b981';
      verifyStatusEl.innerHTML = `<span style="color:#10b981; font-size:11px;">✓</span> VERIFIED OPERATOR [${det.verifiedAt ? det.verifiedAt.substring(11, 16) : 'UTC'}]`;
      verifyBtn.innerHTML = `VERIFIED ✓`;
      verifyBtn.disabled = true;
      verifyBtn.style.opacity = '0.6';
      verifyBtn.style.cursor = 'default';
    } else {
      verifyStatusEl.style.color = 'var(--color-detected-amber)';
      verifyStatusEl.innerHTML = `<span class="status-pulse-dot" style="background:var(--color-detected-amber); width:5px; height:5px;"></span> AI DETECTED`;
      verifyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> VERIFY`;
      verifyBtn.disabled = false;
      verifyBtn.style.opacity = '1';
      verifyBtn.style.cursor = 'pointer';
    }

    // AI EXPLANATION SECTION: WHY WAS THIS DETECTED?
    const exp = det.aiExplanation || {
      acousticIntensity: 92,
      shadowSignature: 89,
      geometryMatch: 95,
      textureMatch: 91,
      contextMatch: 87,
      overallConfidence: Math.round(det.confidence * 100),
      text: "Detected because the acoustic return shows a strong elongated signature with a persistent shadow pattern consistent with a suspended or seabed-contact object."
    };

    document.getElementById('ai-metric-intensity').textContent = `${exp.acousticIntensity}%`;
    document.getElementById('ai-bar-intensity').style.width = `${exp.acousticIntensity}%`;

    document.getElementById('ai-metric-shadow').textContent = `${exp.shadowSignature}%`;
    document.getElementById('ai-bar-shadow').style.width = `${exp.shadowSignature}%`;

    document.getElementById('ai-metric-geometry').textContent = `${exp.geometryMatch}%`;
    document.getElementById('ai-bar-geometry').style.width = `${exp.geometryMatch}%`;

    document.getElementById('ai-metric-texture').textContent = `${exp.textureMatch}%`;
    document.getElementById('ai-bar-texture').style.width = `${exp.textureMatch}%`;

    document.getElementById('ai-metric-context').textContent = `${exp.contextMatch}%`;
    document.getElementById('ai-bar-context').style.width = `${exp.contextMatch}%`;

    document.getElementById('ai-metric-overall').textContent = `${exp.overallConfidence}%`;
    document.getElementById('ai-explanation-text').textContent = exp.text;
  }

  /* ==========================================================================
     DETECTION ITEMS LIST WITH CONFIDENCE FILTERING
     ========================================================================== */
  renderDetectionsList(animated = false) {
    const listContainer = document.getElementById('detection-items-list');
    const countBadge = document.getElementById('target-count-badge');
    const allDets = this.sonarViewer.getAllDetections();
    const visibleDets = allDets.filter(d => d.confidence >= this.sonarViewer.confidenceThreshold);

    countBadge.textContent = `${visibleDets.length}/${allDets.length} DETECTIONS ACTIVE`;
    listContainer.innerHTML = '';

    visibleDets.forEach(det => {
      const card = document.createElement('div');
      const isSelected = this.selectedDetection && this.selectedDetection.id === det.id;
      const isVerified = det.verificationStatus === "VERIFIED BY HYDROGRAPHIC OPERATOR";

      card.className = `detection-item-card ${isSelected ? 'selected' : ''} ${animated ? 'reveal' : ''}`;
      card.id = `det-card-${det.id}`;

      card.innerHTML = `
        <div class="det-item-info">
          <div class="det-item-name" style="display:flex; align-items:center; gap:6px;">
            <span>${det.label}</span>
            ${isVerified ? `<span style="color:#10b981; font-size:10px;" title="Verified by Operator">✓</span>` : ''}
          </div>
          <div class="det-item-meta">${det.category} &bull; ${det.channel || 'Port Swath'}</div>
        </div>
        <div class="det-item-badge">${Math.round(det.confidence * 100)}%</div>
      `;

      card.addEventListener('click', () => {
        sonarAudio.playAnomalyAlert();
        this.selectedDetection = det;
        this.sonarViewer.selectedDetectionId = det.id;
        this.sonarViewer.render();
        if (this.mapViewer) {
          this.mapViewer.setSelectedDetection(det.id);
        }
        this.updateInspectorSidebar(det);
        this.highlightDetectionCard(det.id);
      });

      listContainer.appendChild(card);
    });
  }

  highlightDetectionCard(detId) {
    document.querySelectorAll('.detection-item-card').forEach(c => c.classList.remove('selected'));
    const targetCard = document.getElementById(`det-card-${detId}`);
    if (targetCard) {
      targetCard.classList.add('selected');
    }
  }

  updateAnalyticsCounts() {
    // Dynamic update to recovery analytics counters
    const allDets = this.sonarViewer.getAllDetections();
    const visibleDets = allDets.filter(d => d.confidence >= this.sonarViewer.confidenceThreshold);
    const criticalCount = visibleDets.filter(d => d.severity === 'critical').length;
    
    const countBadge = document.getElementById('target-count-badge');
    if (countBadge) {
      countBadge.textContent = `${visibleDets.length}/${allDets.length} DETECTIONS ACTIVE`;
    }
  }

  updateEnvironmentalMetrics() {
    const stats = this.currentMission.bathymetryStats;
    if (stats) {
      document.getElementById('env-seabed').textContent = stats.seabedType;
      document.getElementById('env-temp').textContent = stats.waterTemp;
      document.getElementById('env-salinity').textContent = stats.salinity;
    }
  }

  updateMapMissionCard(mission) {
    const nameEl = document.getElementById('map-mission-name');
    const coordsEl = document.getElementById('map-mission-coords');
    const summaryEl = document.getElementById('map-mission-summary');

    if (nameEl) nameEl.textContent = mission.name;
    if (coordsEl) coordsEl.textContent = mission.coordsFormatted;
    if (summaryEl) summaryEl.textContent = mission.summary;
  }

  switchMission(missionId) {
    const mission = MISSION_DATASETS.find(m => m.id === missionId);
    if (!mission) return;

    this.currentMission = mission;
    this.selectedDetection = mission.detections[0];

    const selector = document.getElementById('dataset-selector');
    if (selector.value !== missionId) {
      selector.value = missionId;
    }

    this.sonarViewer.loadDataset(mission);
    if (this.mapViewer) {
      this.mapViewer.setActiveMission(mission);
      this.mapViewer.setSelectedDetection(this.selectedDetection ? this.selectedDetection.id : null);
      this.updateMapMissionCard(mission);
    }
    this.updateMissionCommandStrip(mission);
    this.updateInspectorSidebar(this.selectedDetection);
    this.renderDetectionsList(false);
    this.updateEnvironmentalMetrics();
  }

  /* ==========================================================================
     MODALS: EXPORT & CUSTOM INGESTION
     ========================================================================== */
  initModals() {
    // Inspection Report Modal
    const modalReport = document.getElementById('modal-report');
    const btnOpenReport = document.getElementById('btn-export-report');
    const btnCloseReport = document.getElementById('btn-close-report');
    const reportContainer = document.getElementById('modal-report-content');

    const openReport = () => {
      sonarAudio.playClick();
      const allDetections = this.sonarViewer.getAllDetections();
      reportContainer.innerHTML = ReportGenerator.generateExecutiveSummaryHtml(this.currentMission, allDetections);
      modalReport.classList.add('open');
    };

    btnOpenReport.addEventListener('click', openReport);
    btnCloseReport.addEventListener('click', () => modalReport.classList.remove('open'));

    // Download GeoJSON
    document.getElementById('btn-download-geojson').addEventListener('click', () => {
      sonarAudio.playClick();
      const allDets = this.sonarViewer.getAllDetections();
      ReportGenerator.downloadGeoJSON(this.currentMission, allDets);
    });

    // Download CSV
    const exportCsvHandler = () => {
      sonarAudio.playClick();
      const allDets = this.sonarViewer.getAllDetections();
      ReportGenerator.downloadCSV(this.currentMission, allDets);
    };
    document.getElementById('btn-download-csv').addEventListener('click', exportCsvHandler);
    document.getElementById('btn-export-csv').addEventListener('click', exportCsvHandler);

    // Print / PDF
    document.getElementById('btn-print-report').addEventListener('click', () => {
      window.print();
    });

    // Upload Ingest Modal
    const modalUpload = document.getElementById('modal-upload');
    const btnOpenUpload = document.getElementById('btn-open-upload');
    const btnCloseUpload = document.getElementById('btn-close-upload');
    const dropzone = document.getElementById('sonar-dropzone');
    const fileInput = document.getElementById('sonar-file-input');

    btnOpenUpload.addEventListener('click', () => {
      sonarAudio.playClick();
      const tabIngest = document.getElementById('tab-ingest');
      if (tabIngest) {
        tabIngest.click();
      } else {
        modalUpload.classList.add('open');
      }
    });

    btnCloseUpload.addEventListener('click', () => modalUpload.classList.remove('open'));

    // File Drag & Drop
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        if (this.sonarIngest) {
          this.sonarIngest.handleFileSelected(files[0]);
        }
        this.handleIngestFile(files[0]);
        modalUpload.classList.remove('open');
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        if (this.sonarIngest) {
          this.sonarIngest.handleFileSelected(e.target.files[0]);
        }
        this.handleIngestFile(e.target.files[0]);
        modalUpload.classList.remove('open');
      }
    });
  }

  handleIngestFile(file) {
    this.sonarViewer.loadCustomImageFile(file);
    document.getElementById('tab-sonar').click();
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.marineGuard = new MarineGuardApp();
});
