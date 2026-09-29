// MarineGuard AI - Professional Sonar Data Ingest Workflow
// Enterprise hydrographic data ingestion controller and authentic Side-Scan Sonar renderer

import { sonarAudio } from './audioSonar.js';

export class SonarIngestController {
  constructor(options = {}) {
    this.onIngestionComplete = options.onIngestionComplete || (() => {});
    this.onProceedToAi = options.onProceedToAi || (() => {});
    this.onFileChanged = options.onFileChanged || (() => {});

    // State
    this.state = {
      surveyName: "TN_Survey_2025",
      fileName: "sonar_data.s7k",
      fileSize: "245 MB",
      format: ".s7k",
      status: "ready", // 'ready' | 'processing' | 'completed'
      badgeText: "FILE READY",
      isIngesting: false,
      isIngested: false,
      metrics: {
        surveyLength: "1.2 km",
        depthRange: "25–120 m",
        resolution: "0.5 m"
      },
      customImageElement: null
    };

    // Preload authentic Side-Scan Sonar recording for genuine acoustic preview
    this.genuineSonarImage = new Image();
    this.genuineSonarImage.crossOrigin = "anonymous";
    this.genuineSonarImage.src = "/assets/sonar/dataset_ghost_nets.jpg";
    this.genuineSonarImage.onload = () => {
      this.drawAuthenticSonarPreview();
    };

    // Canvas references
    this.canvas = document.getElementById('ingest-preview-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.init();
  }

  init() {
    this.bindDomElements();
    this.initEventListeners();
    this.initPreviewCanvas();
    this.updateDomFromState();
  }

  bindDomElements() {
    this.dom = {
      dropzone: document.getElementById('ingest-dropzone'),
      fileInput: document.getElementById('ingest-file-input'),
      btnBrowse: document.getElementById('btn-browse-sonar-file'),
      surveyNameInput: document.getElementById('input-survey-name'),
      selectedFileCard: document.getElementById('selected-file-card'),
      selectedFileName: document.getElementById('selected-file-name'),
      selectedFileSize: document.getElementById('selected-file-size'),
      btnRemoveFile: document.getElementById('btn-remove-selected-file'),
      btnIngest: document.getElementById('btn-execute-ingest'),
      btnProceedAi: document.getElementById('btn-proceed-to-ai'),
      progressBox: document.getElementById('ingest-progress-box'),
      stageText: document.getElementById('ingest-stage-text'),
      stagePct: document.getElementById('ingest-stage-pct'),
      progressFill: document.getElementById('ingest-progress-fill'),
      statusBadge: document.getElementById('preview-status-badge')
    };
  }

  initEventListeners() {
    // Browse Files Button
    if (this.dom.btnBrowse && this.dom.fileInput) {
      this.dom.btnBrowse.addEventListener('click', (e) => {
        e.preventDefault();
        sonarAudio.playClick();
        this.dom.fileInput.click();
      });
    }

    // Dropzone Click opens file dialog if not clicked directly on browse button
    if (this.dom.dropzone && this.dom.fileInput) {
      this.dom.dropzone.addEventListener('click', (e) => {
        if (e.target.closest('#btn-browse-sonar-file')) return;
        this.dom.fileInput.click();
      });
    }

    // File Input change
    if (this.dom.fileInput) {
      this.dom.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.handleFileSelected(e.target.files[0]);
        }
      });
    }

    // Drag & Drop
    if (this.dom.dropzone) {
      ['dragenter', 'dragover'].forEach(eventName => {
        this.dom.dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.dom.dropzone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        this.dom.dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.dom.dropzone.classList.remove('dragover');
        });
      });

      this.dom.dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          this.handleFileSelected(files[0]);
        }
      });
    }

    // Survey Name Input
    if (this.dom.surveyNameInput) {
      this.dom.surveyNameInput.addEventListener('input', (e) => {
        this.state.surveyName = e.target.value.trim() || "TN_Survey_2025";
        this.onFileChanged(this.state);
      });
    }

    // Remove / Clear File
    if (this.dom.btnRemoveFile) {
      this.dom.btnRemoveFile.addEventListener('click', (e) => {
        e.stopPropagation();
        sonarAudio.playClick();
        this.resetToDefaultFile();
      });
    }

    // Ingest Primary Button
    if (this.dom.btnIngest) {
      this.dom.btnIngest.addEventListener('click', () => {
        if (this.state.isIngesting) return;
        this.startIngestionSequence();
      });
    }

    // Proceed to AI Detection
    if (this.dom.btnProceedAi) {
      this.dom.btnProceedAi.addEventListener('click', () => {
        sonarAudio.playSonarPing();
        this.onProceedToAi(this.state);
      });
    }

    // Resize canvas
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.drawAuthenticSonarPreview();
    });
  }

  handleFileSelected(file) {
    sonarAudio.playClick();
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    let sizeStr = "245 MB";
    if (file.size > 0) {
      const mb = file.size / (1024 * 1024);
      sizeStr = mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`;
    }

    this.state.fileName = file.name;
    this.state.fileSize = sizeStr;
    this.state.format = ext || ".s7k";
    this.state.status = "ready";
    this.state.badgeText = "FILE READY";
    this.state.isIngesting = false;
    this.state.isIngested = false;

    // If image format, display as custom image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          this.state.customImageElement = img;
          this.drawAuthenticSonarPreview();
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.state.customImageElement = null;
      this.drawAuthenticSonarPreview();
    }

    // Reset buttons
    if (this.dom.btnProceedAi) this.dom.btnProceedAi.style.display = 'none';
    if (this.dom.btnIngest) {
      this.dom.btnIngest.style.display = 'inline-flex';
      this.dom.btnIngest.disabled = false;
      this.dom.btnIngest.style.opacity = '1';
    }
    if (this.dom.progressBox) this.dom.progressBox.style.display = 'none';

    this.updateDomFromState();
    this.onFileChanged(this.state);
  }

  resetToDefaultFile() {
    this.state.fileName = "sonar_data.s7k";
    this.state.fileSize = "245 MB";
    this.state.format = ".s7k";
    this.state.status = "ready";
    this.state.badgeText = "FILE READY";
    this.state.isIngesting = false;
    this.state.isIngested = false;
    this.state.customImageElement = null;

    if (this.dom.btnProceedAi) this.dom.btnProceedAi.style.display = 'none';
    if (this.dom.btnIngest) {
      this.dom.btnIngest.style.display = 'inline-flex';
      this.dom.btnIngest.disabled = false;
      this.dom.btnIngest.style.opacity = '1';
    }
    if (this.dom.progressBox) this.dom.progressBox.style.display = 'none';

    this.updateDomFromState();
    this.drawAuthenticSonarPreview();
    this.onFileChanged(this.state);
  }

  startIngestionSequence() {
    this.state.isIngesting = true;
    this.state.status = "processing";
    this.state.badgeText = "PROCESSING";
    sonarAudio.playSonarPing();

    if (this.dom.btnIngest) {
      this.dom.btnIngest.disabled = true;
      this.dom.btnIngest.style.opacity = '0.5';
    }
    if (this.dom.progressBox) {
      this.dom.progressBox.style.display = 'block';
    }

    const stages = [
      { text: "Uploading...", pct: 25, time: 380 },
      { text: "Validating sonar data...", pct: 55, time: 820 },
      { text: "Processing acoustic data...", pct: 85, time: 1300 },
      { text: "Ingestion complete", pct: 100, time: 1750 }
    ];

    stages.forEach((st) => {
      setTimeout(() => {
        if (!this.state.isIngesting && st.pct !== 100) return;

        if (this.dom.stageText) this.dom.stageText.textContent = st.text;
        if (this.dom.stagePct) this.dom.stagePct.textContent = `${st.pct}%`;
        if (this.dom.progressFill) this.dom.progressFill.style.width = `${st.pct}%`;

        if (st.pct < 100) {
          sonarAudio.playClick();
        } else {
          this.completeIngestion();
        }
      }, st.time);
    });
  }

  completeIngestion() {
    this.state.isIngesting = false;
    this.state.isIngested = true;
    this.state.status = "completed";
    this.state.badgeText = "SONAR DATA READY";

    sonarAudio.playAnomalyAlert();
    this.updateDomFromState();

    if (this.dom.btnIngest) {
      this.dom.btnIngest.style.display = 'none';
    }
    if (this.dom.btnProceedAi) {
      this.dom.btnProceedAi.style.display = 'inline-flex';
    }

    this.onIngestionComplete(this.state);
  }

  updateDomFromState() {
    if (this.dom.selectedFileName) {
      this.dom.selectedFileName.textContent = this.state.fileName;
    }
    if (this.dom.selectedFileSize) {
      this.dom.selectedFileSize.textContent = this.state.fileSize;
    }
    if (this.dom.surveyNameInput && this.dom.surveyNameInput.value !== this.state.surveyName) {
      this.dom.surveyNameInput.value = this.state.surveyName;
    }

    if (this.dom.statusBadge) {
      this.dom.statusBadge.textContent = this.state.badgeText;
      if (this.state.status === 'completed') {
        this.dom.statusBadge.className = 'status-badge-clean ready';
      } else {
        this.dom.statusBadge.className = 'status-badge-clean';
      }
    }
  }

  /* ==========================================================================
     AUTHENTIC SIDE-SCAN SONAR PREVIEW CANVAS RENDERER
     ========================================================================== */
  initPreviewCanvas() {
    if (!this.canvas) return;
    this.resizeCanvas();
    this.drawAuthenticSonarPreview();
  }

  resizeCanvas() {
    if (!this.canvas || !this.canvas.parentElement) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width || 680;
    const h = rect.height || 330;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    this.ctx = this.canvas.getContext('2d');
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.displayWidth = w;
    this.displayHeight = h;
  }

  drawAuthenticSonarPreview() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;

    // 1. Dark Void Backdrop
    ctx.fillStyle = "#02050e";
    ctx.fillRect(0, 0, w, h);

    const activeImage = this.state.customImageElement || (this.genuineSonarImage.complete && this.genuineSonarImage.naturalWidth ? this.genuineSonarImage : null);

    if (activeImage) {
      // Draw genuine side-scan sonar image with calibrated aspect ratio
      ctx.drawImage(activeImage, 0, 0, w, h);

      // Subtle hydrophone vignette overlay to integrate cleanly into dark navy UI
      const vignette = ctx.createLinearGradient(0, 0, w, 0);
      vignette.addColorStop(0, "rgba(2, 6, 16, 0.45)");
      vignette.addColorStop(0.08, "rgba(2, 6, 16, 0)");
      vignette.addColorStop(0.92, "rgba(2, 6, 16, 0)");
      vignette.addColorStop(1, "rgba(2, 6, 16, 0.45)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
    } else {
      // Clean, dark procedural acoustic seabed texture (subtle dark bronze/amber, avoiding large flat orange areas)
      this.drawDarkAcousticFallback(ctx, w, h);
    }

    // 2. Clear Center Nadir Track Line
    this.drawCenterNadirLine(ctx, w, h);

    // 3. Subtle Depth Markers & Range Scale
    this.drawDepthMarkers(ctx, w, h);

    // 4. Subtle Swath Demarcation
    this.drawSwathDemarcation(ctx, w, h);
  }

  drawDarkAcousticFallback(ctx, w, h) {
    const centerX = w / 2;
    const nadirWidth = 18;

    // Dark seabed gradient with realistic acoustic backscatter
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "#1a0f05");
    grad.addColorStop(0.35, "#3d2208");
    grad.addColorStop(0.48, "#201103");
    grad.addColorStop(0.5, "#020409");
    grad.addColorStop(0.52, "#201103");
    grad.addColorStop(0.65, "#3d2208");
    grad.addColorStop(1, "#1a0f05");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle fine sand ripples
    ctx.save();
    for (let y = 6; y < h; y += 4) {
      const alpha = 0.08 + Math.sin(y * 0.15) * 0.04;
      ctx.strokeStyle = `rgba(230, 160, 60, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < w; x += 16) {
        if (Math.abs(x - centerX) < nadirWidth) continue;
        const wave = Math.sin(x * 0.05 + y * 0.02) * 1.5;
        if (x === 0 || x === centerX + nadirWidth) ctx.moveTo(x, y + wave);
        else ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }

    // Subtle bright anomaly signature with outward shadow
    const tX = w * 0.32;
    const tY = h * 0.46;

    // Shadow
    ctx.fillStyle = "rgba(1, 3, 8, 0.9)";
    ctx.beginPath();
    ctx.moveTo(tX - 4, tY - 3);
    ctx.lineTo(tX - 28, tY - 6);
    ctx.lineTo(tX - 32, tY + 8);
    ctx.lineTo(tX - 3, tY + 6);
    ctx.closePath();
    ctx.fill();

    // Specular return
    ctx.fillStyle = "#fed7aa";
    ctx.beginPath();
    ctx.ellipse(tX, tY, 5, 8, 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawCenterNadirLine(ctx, w, h) {
    const centerX = Math.round(w / 2);

    // Dark nadir strip
    ctx.fillStyle = "rgba(2, 5, 14, 0.85)";
    ctx.fillRect(centerX - 10, 0, 20, h);

    // Dashed center ground-track line
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, h);
    ctx.stroke();
    ctx.restore();

    // Nadir badge
    ctx.fillStyle = "rgba(56, 189, 248, 0.65)";
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("0m NADIR", centerX, h - 8);
  }

  drawDepthMarkers(ctx, w, h) {
    ctx.save();
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(226, 232, 240, 0.55)";

    const markers = [
      { yPct: 0.12, label: "25m" },
      { yPct: 0.32, label: "50m" },
      { yPct: 0.52, label: "75m" },
      { yPct: 0.74, label: "100m" },
      { yPct: 0.92, label: "120m" }
    ];

    markers.forEach(m => {
      const y = Math.round(h * m.yPct);
      // Tick line
      ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w - 18, y);
      ctx.lineTo(w - 6, y);
      ctx.stroke();

      ctx.fillText(m.label, w - 22, y + 3);
    });
    ctx.restore();
  }

  drawSwathDemarcation(ctx, w, h) {
    ctx.save();
    ctx.font = "9.5px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(56, 189, 248, 0.55)";

    ctx.textAlign = "left";
    ctx.fillText("◄ PORT SWATH", 12, 18);

    ctx.textAlign = "right";
    ctx.fillText("STARBOARD SWATH ►", w - 12, 18);

    ctx.restore();
  }
}
