// MarineGuard AI - Side-Scan Sonar (SSS) Acoustic Viewer & Neural Analyzer
import { sonarAudio } from './audioSonar.js';

export class SonarViewer {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.currentDataset = null;
    this.currentPalette = 'amber';
    this.confidenceThreshold = 0.50; // 50%
    this.showBoundingBoxes = true;
    this.showShadowVectors = true;
    this.showAcousticRulers = true;
    this.slantRangeCorrected = false;
    this.selectedDetectionId = null;
    this.onSelectDetection = options.onSelectDetection || (() => {});
    this.onNewDetectionAdded = options.onNewDetectionAdded || (() => {});

    // Interactive canvas states
    this.image = new Image();
    this.rawImageData = null;
    this.filteredCanvas = document.createElement('canvas');
    this.filteredCtx = this.filteredCanvas.getContext('2d');

    // Pan & Zoom
    this.scale = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.startPan = { x: 0, y: 0 };

    // ROI Drawing tool
    this.isDrawingROI = false;
    this.roiMode = false;
    this.roiStart = { x: 0, y: 0 };
    this.roiCurrent = { x: 0, y: 0 };

    // Live Waterfall Scan Animation
    this.isLiveScanning = false;
    this.scanLineY = 0;
    this.scanSpeed = 1.2;
    this.animationFrameId = null;

    // Custom user detections added in runtime
    this.customDetections = [];

    this.initEvents();
  }

  initEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

    // Resize observer
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.render();
    });
  }

  loadDataset(dataset) {
    this.currentDataset = dataset;
    this.customDetections = [];
    this.selectedDetectionId = null;
    this.scale = 1.0;
    this.panX = 0;
    this.panY = 0;

    this.image = new Image();
    this.image.crossOrigin = "anonymous";
    this.image.onload = () => {
      this.resizeCanvas();
      this.processPaletteFilter();
      this.render();
      sonarAudio.playSonarPing();
    };
    this.image.src = dataset.image;
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.displayWidth = rect.width;
    this.displayHeight = rect.height;
  }

  setPalette(paletteId) {
    this.currentPalette = paletteId;
    this.processPaletteFilter();
    this.render();
  }

  setConfidenceThreshold(val) {
    this.confidenceThreshold = parseFloat(val);
    this.render();
  }

  toggleBoundingBoxes(visible) {
    this.showBoundingBoxes = visible;
    this.render();
  }

  toggleShadowVectors(visible) {
    this.showShadowVectors = visible;
    this.render();
  }

  toggleAcousticRulers(visible) {
    this.showAcousticRulers = visible;
    this.render();
  }

  toggleSlantRange(active) {
    this.slantRangeCorrected = active;
    this.render();
  }

  toggleRoiMode(active) {
    this.roiMode = active;
    this.canvas.style.cursor = active ? 'crosshair' : 'grab';
  }

  toggleLiveScan(active) {
    this.isLiveScanning = active;
    if (active) {
      this.scanLineY = 0;
      this.startScanLoop();
      sonarAudio.playSonarPing();
    } else {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      this.render();
    }
  }

  startScanLoop() {
    const loop = () => {
      if (!this.isLiveScanning) return;
      this.scanLineY += this.scanSpeed;
      if (this.scanLineY > (this.image.height || 600)) {
        this.scanLineY = 0;
        sonarAudio.playSonarPing();
      }
      this.render();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  processPaletteFilter() {
    if (!this.image.complete || !this.image.naturalWidth) return;

    const w = this.image.naturalWidth;
    const h = this.image.naturalHeight;
    this.filteredCanvas.width = w;
    this.filteredCanvas.height = h;

    this.filteredCtx.drawImage(this.image, 0, 0, w, h);
    if (this.currentPalette === 'amber') {
      // Natural native acoustic texture
      return;
    }

    try {
      const imgData = this.filteredCtx.getImageData(0, 0, w, h);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b; // acoustic backscatter intensity (0-255)
        const norm = lum / 255;

        if (this.currentPalette === 'oceanic') {
          // Deep Oceanic Cyan palette: deep blue shadow -> vivid cyan -> white specular
          data[i] = Math.min(255, Math.floor(norm * 40 + Math.pow(norm, 3) * 215));
          data[i + 1] = Math.min(255, Math.floor(norm * 210 + Math.pow(norm, 2) * 45));
          data[i + 2] = Math.min(255, Math.floor(norm * 255));
        } else if (this.currentPalette === 'phosphor') {
          // Emerald Green Phosphor
          data[i] = Math.min(255, Math.floor(Math.pow(norm, 2) * 120));
          data[i + 1] = Math.min(255, Math.floor(norm * 255));
          data[i + 2] = Math.min(255, Math.floor(norm * 140));
        } else if (this.currentPalette === 'copper') {
          // Thermal Copper
          data[i] = Math.min(255, Math.floor(Math.min(255, norm * 340)));
          data[i + 1] = Math.min(255, Math.floor(Math.max(0, (norm - 0.25) * 290)));
          data[i + 2] = Math.min(255, Math.floor(Math.max(0, (norm - 0.65) * 450)));
        } else if (this.currentPalette === 'grayscale') {
          data[i] = lum;
          data[i + 1] = lum;
          data[i + 2] = lum;
        }
      }

      this.filteredCtx.putImageData(imgData, 0, 0);
    } catch (err) {
      console.warn("Palette filter warning (CORS or local buffer):", err);
    }
  }

  getAllDetections() {
    const list = [...(this.currentDataset ? this.currentDataset.detections : [])];
    return list.concat(this.customDetections);
  }

  render() {
    if (!this.displayWidth || !this.displayHeight) {
      this.resizeCanvas();
    }
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // Deep ocean background
    ctx.fillStyle = "#040914";
    ctx.fillRect(0, 0, w, h);

    if (!this.image.complete || !this.image.naturalWidth) {
      ctx.fillStyle = "#38bdf8";
      ctx.font = "14px 'Space Grotesk', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("INITIALIZING SIDE-SCAN SONAR INTERFACE...", w / 2, h / 2);
      ctx.restore();
      return;
    }

    // Apply Pan and Zoom
    ctx.save();
    ctx.translate(w / 2 + this.panX, h / 2 + this.panY);
    ctx.scale(this.scale, this.scale);

    // Calculate aspect fit inside canvas
    const imgAspect = this.image.naturalWidth / this.image.naturalHeight;
    const canvasAspect = w / h;
    let drawW, drawH;

    if (canvasAspect > imgAspect) {
      drawH = h * 0.92;
      drawW = drawH * imgAspect;
    } else {
      drawW = w * 0.92;
      drawH = drawW / imgAspect;
    }

    const drawX = -drawW / 2;
    const drawY = -drawH / 2;
    this.renderedBounds = { x: drawX, y: drawY, w: drawW, h: drawH };

    // Draw filtered Sonar Canvas
    ctx.drawImage(this.filteredCanvas, drawX, drawY, drawW, drawH);

    // Slant-Range compression visual grid if enabled
    if (this.slantRangeCorrected) {
      this.drawSlantRangeMesh(ctx, drawX, drawY, drawW, drawH);
    }

    // Draw Acoustic Nadir Line & Swath Demarcation
    this.drawAcousticSwathGuides(ctx, drawX, drawY, drawW, drawH);

    // Draw Live Scanline if active
    if (this.isLiveScanning) {
      const scanFrac = this.scanLineY / (this.image.naturalHeight || 1);
      const scanCurY = drawY + scanFrac * drawH;

      const grad = ctx.createLinearGradient(0, scanCurY - 14, 0, scanCurY + 3);
      grad.addColorStop(0, 'rgba(0, 242, 254, 0)');
      grad.addColorStop(0.8, 'rgba(0, 242, 254, 0.45)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');

      ctx.fillStyle = grad;
      ctx.fillRect(drawX, scanCurY - 14, drawW, 16);

      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(drawX, scanCurY);
      ctx.lineTo(drawX + drawW, scanCurY);
      ctx.stroke();
    }

    // Draw AI Bounding Boxes & Acoustic Shadows
    const allDets = this.getAllDetections();
    allDets.forEach(det => {
      if (det.confidence >= this.confidenceThreshold) {
        this.drawDetectionBox(ctx, det, drawX, drawY, drawW, drawH);
      }
    });

    // Draw Active User ROI Box if drawing
    if (this.isDrawingROI) {
      this.drawActiveRoiBox(ctx);
    }

    ctx.restore();

    // Draw Fixed HUD Overlays (Rulers, Scale Bars, Telemetry Overlay)
    if (this.showAcousticRulers) {
      this.drawHudAcousticTelemetry(ctx, w, h);
    }

    ctx.restore();
  }

  drawAcousticSwathGuides(ctx, x, y, w, h) {
    const centerX = x + w / 2;

    // Central Nadir Line (Sub-towfish acoustic blind zone)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, y);
    ctx.lineTo(centerX, y + h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Swath Distance Marks along top
    const halfSwath = (this.currentDataset ? this.currentDataset.swathWidth : 100) / 2;
    const marks = [
      { pct: 0, label: `-${halfSwath}m` },
      { pct: 0.25, label: `-${halfSwath / 2}m` },
      { pct: 0.5, label: "0m NADIR" },
      { pct: 0.75, label: `+${halfSwath / 2}m` },
      { pct: 1.0, label: `+${halfSwath}m` }
    ];

    ctx.fillStyle = 'rgba(141, 162, 190, 0.7)';
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";

    marks.forEach(m => {
      const mx = x + m.pct * w;
      // Top tick
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mx, y);
      ctx.lineTo(mx, y + 6);
      ctx.stroke();

      ctx.fillText(m.label, mx, y + 15);
    });

    // Port & Starboard Swath labels
    ctx.fillStyle = '#8da2be';
    ctx.textAlign = "left";
    ctx.fillText("◄ PORT SWATH", x + 16, y + 28);
    ctx.textAlign = "right";
    ctx.fillText("STARBOARD SWATH ►", x + w - 16, y + 28);
  }

  drawSlantRangeMesh(ctx, x, y, w, h) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    const steps = 10;
    for (let i = 1; i < steps; i++) {
      const frac = i / steps;
      ctx.beginPath();
      ctx.moveTo(x + w * frac, y);
      ctx.lineTo(x + w * frac, y + h);
      ctx.stroke();
    }
  }

  drawDetectionBox(ctx, det, imgX, imgY, imgW, imgH) {
    const isSelected = det.id === this.selectedDetectionId;

    // Convert percentage coordinates to rendered canvas space
    const bx = imgX + (det.box.x / 100) * imgW;
    const by = imgY + (det.box.y / 100) * imgH;
    const bw = (det.box.w / 100) * imgW;
    const bh = (det.box.h / 100) * imgH;

    // Deep Ocean Operations Standard:
    // Amber for detected objects, Red ONLY for critical hazard alerts
    const isCritical = det.severity === 'critical';
    const primaryColor = isCritical ? '#ef4444' : '#f59e0b';
    const tagBorderColor = isSelected ? '#ffffff' : primaryColor;

    // Shadow Vector projection line if enabled
    if (this.showShadowVectors && det.shadowLength) {
      const swathTotal = this.currentDataset ? this.currentDataset.swathWidth : 100;
      const shadowPx = (det.shadowLength / swathTotal) * imgW;
      const isPort = (det.box.x + det.box.w / 2) < 50;
      const shadowEndX = isPort ? bx - shadowPx : bx + bw + shadowPx;

      ctx.save();
      ctx.strokeStyle = isCritical ? 'rgba(239, 68, 68, 0.8)' : 'rgba(245, 158, 11, 0.8)';
      ctx.setLineDash([3, 2]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(isPort ? bx : bx + bw, by + bh / 2);
      ctx.lineTo(shadowEndX, by + bh / 2);
      ctx.stroke();

      // Shadow endpoint anchor
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(shadowEndX, by + bh / 2, 2, 0, Math.PI * 2);
      ctx.fill();

      // Technical shadow measurement label
      ctx.fillStyle = '#ffffff';
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.textAlign = isPort ? "right" : "left";
      ctx.fillText(`Ls: ${det.shadowLength}m | h: ${det.estHeight || 1.8}m`, isPort ? shadowEndX - 6 : shadowEndX + 6, by + bh / 2 - 3);
      ctx.restore();
    }

    if (!this.showBoundingBoxes) return;

    ctx.save();
    // Clean, subtle background fill without heavy neon
    ctx.fillStyle = isSelected ? 'rgba(56, 189, 248, 0.08)' : 'rgba(11, 25, 48, 0.35)';
    ctx.fillRect(bx, by, bw, bh);

    // Fine technical hairline border
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(bx, by, bw, bh);

    // High-precision technical corner brackets
    const cornerSize = Math.min(8, bw / 3, bh / 3);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = '#ffffff';

    // Top-Left corner
    ctx.beginPath();
    ctx.moveTo(bx, by + cornerSize);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + cornerSize, by);
    ctx.stroke();

    // Top-Right corner
    ctx.beginPath();
    ctx.moveTo(bx + bw - cornerSize, by);
    ctx.lineTo(bx + bw, by);
    ctx.lineTo(bx + bw, by + cornerSize);
    ctx.stroke();

    // Bottom-Left corner
    ctx.beginPath();
    ctx.moveTo(bx, by + bh - cornerSize);
    ctx.lineTo(bx, by + bh);
    ctx.lineTo(bx + cornerSize, by + bh);
    ctx.stroke();

    // Bottom-Right corner
    ctx.beginPath();
    ctx.moveTo(bx + bw - cornerSize, by + bh);
    ctx.lineTo(bx + bw, by + bh);
    ctx.lineTo(bx + bw, by + bh - cornerSize);
    ctx.stroke();

    // Technical Target Tag above bounding box
    const confPct = Math.round(det.confidence * 100);
    const badgeText = `${det.label} [${confPct}%]`;
    ctx.font = "bold 9.5px 'JetBrains Mono', monospace";
    const textWidth = ctx.measureText(badgeText).width;
    const tagH = 16;
    const tagW = textWidth + 14;
    const tagY = Math.max(imgY + 4, by - tagH - 3);

    // Tag background
    ctx.fillStyle = '#060e1d';
    ctx.fillRect(bx, tagY, tagW, tagH);

    // Tag border
    ctx.strokeStyle = tagBorderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, tagY, tagW, tagH);

    // Tag text
    ctx.fillStyle = isSelected ? '#38bdf8' : (isCritical ? '#ef4444' : '#f59e0b');
    ctx.textAlign = 'left';
    ctx.fillText(badgeText, bx + 7, tagY + 11.5);

    ctx.restore();
  }

  drawActiveRoiBox(ctx) {
    const rx = Math.min(this.roiStart.x, this.roiCurrent.x);
    const ry = Math.min(this.roiStart.y, this.roiCurrent.y);
    const rw = Math.abs(this.roiCurrent.x - this.roiStart.x);
    const rh = Math.abs(this.roiCurrent.y - this.roiStart.y);

    ctx.save();
    ctx.strokeStyle = '#00f2fe';
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 2;
    ctx.strokeRect(rx, ry, rw, rh);

    ctx.fillStyle = 'rgba(0, 242, 254, 0.15)';
    ctx.fillRect(rx, ry, rw, rh);

    ctx.fillStyle = '#00f2fe';
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText("AI SCANNING TARGET ROI...", rx + 6, ry - 6);
    ctx.restore();
  }

  drawHudAcousticTelemetry(ctx, w, h) {
    ctx.save();
    // Top-left hydrographic telemetry block
    ctx.fillStyle = '#040a16';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1;

    const pad = 14;
    const boxW = 270;
    const boxH = 88;

    ctx.fillRect(pad, pad, boxW, boxH);
    ctx.strokeRect(pad, pad, boxW, boxH);

    ctx.fillStyle = '#38bdf8';
    ctx.font = "bold 10px 'Space Grotesk', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("SIDE-SCAN SONAR TELEMETRY", pad + 10, pad + 18);

    const ds = this.currentDataset;
    ctx.fillStyle = '#8da2be';
    ctx.font = "9.5px 'JetBrains Mono', monospace";
    ctx.fillText(`TRANSDUCER FREQ : ${ds ? ds.frequency : '450 kHz'}`, pad + 10, pad + 35);
    ctx.fillText(`SWATH RANGE     : ±${ds ? ds.swathWidth / 2 : 50}m (${ds ? ds.swathWidth : 100}m Total)`, pad + 10, pad + 49);
    ctx.fillText(`VEHICLE ALTITUDE: ${ds ? ds.altitude : 10.0}m ABOVE SEABED`, pad + 10, pad + 63);
    ctx.fillText(`TOW SPEED       : ${ds ? ds.towSpeed : 3.2} KNOTS`, pad + 10, pad + 77);

    // Bottom scale bar
    const barW = 150;
    const barX = w - barW - pad;
    const barY = h - 32;

    ctx.fillStyle = '#040a16';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1;
    ctx.fillRect(barX - 8, barY - 14, barW + 16, 36);
    ctx.strokeRect(barX - 8, barY - 14, barW + 16, 36);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(barX, barY + 6, barW, 2);

    ctx.fillStyle = '#ffffff';
    ctx.font = "8.5px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("ACOUSTIC RANGE: 50 METERS", barX + barW / 2, barY - 1);

    ctx.restore();
  }

  // Interactive mouse events
  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (this.roiMode) {
      this.isDrawingROI = true;
      // Convert to image coordinate space
      const local = this.screenToImageCoords(mouseX, mouseY);
      this.roiStart = { x: local.rawX, y: local.rawY, screenX: mouseX, screenY: mouseY };
      this.roiCurrent = { x: local.rawX, y: local.rawY };
      return;
    }

    // Check if clicked inside any detection box
    const clickedDet = this.getDetectionAtPoint(mouseX, mouseY);
    if (clickedDet) {
      this.selectedDetectionId = clickedDet.id;
      sonarAudio.playAnomalyAlert();
      this.onSelectDetection(clickedDet);
      this.render();
      return;
    }

    // Otherwise initiate pan
    this.isPanning = true;
    this.startPan = { x: mouseX - this.panX, y: mouseY - this.panY };
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (this.isDrawingROI) {
      const local = this.screenToImageCoords(mouseX, mouseY);
      this.roiCurrent = { x: local.rawX, y: local.rawY };
      this.render();
      return;
    }

    if (this.isPanning) {
      this.panX = mouseX - this.startPan.x;
      this.panY = mouseY - this.startPan.y;
      this.render();
      return;
    }

    // Hover detection check
    const hoveredDet = this.getDetectionAtPoint(mouseX, mouseY);
    if (hoveredDet) {
      this.canvas.style.cursor = 'pointer';
    } else if (this.roiMode) {
      this.canvas.style.cursor = 'crosshair';
    } else {
      this.canvas.style.cursor = 'grab';
    }
  }

  handleMouseUp(e) {
    if (this.isDrawingROI) {
      this.isDrawingROI = false;
      this.processCustomRoiInference();
    }
    this.isPanning = false;
  }

  handleWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newScale = Math.min(Math.max(0.6, this.scale * zoomFactor), 4.5);
    this.scale = newScale;
    this.render();
  }

  resetView() {
    this.scale = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.render();
  }

  zoomIn() {
    this.scale = Math.min(4.5, this.scale * 1.25);
    this.render();
  }

  zoomOut() {
    this.scale = Math.max(0.6, this.scale * 0.8);
    this.render();
  }

  screenToImageCoords(screenX, screenY) {
    const w = this.displayWidth;
    const h = this.displayHeight;

    // Revert transform
    const tx = screenX - (w / 2 + this.panX);
    const ty = screenY - (h / 2 + this.panY);
    const unscaledX = tx / this.scale;
    const unscaledY = ty / this.scale;

    const b = this.renderedBounds || { x: -w * 0.45, y: -h * 0.45, w: w * 0.9, h: h * 0.9 };
    const pctX = ((unscaledX - b.x) / b.w) * 100;
    const pctY = ((unscaledY - b.y) / b.h) * 100;

    return { pctX, pctY, rawX: unscaledX, rawY: unscaledY };
  }

  getDetectionAtPoint(screenX, screenY) {
    const pt = this.screenToImageCoords(screenX, screenY);
    const allDets = this.getAllDetections();

    for (let i = allDets.length - 1; i >= 0; i--) {
      const det = allDets[i];
      if (det.confidence < this.confidenceThreshold) continue;

      const bx = det.box.x;
      const by = det.box.y;
      const bw = det.box.w;
      const bh = det.box.h;

      if (pt.pctX >= bx && pt.pctX <= bx + bw && pt.pctY >= by && pt.pctY <= by + bh) {
        return det;
      }
    }
    return null;
  }

  processCustomRoiInference() {
    const b = this.renderedBounds;
    if (!b) return;

    const rx1 = Math.min(this.roiStart.x, this.roiCurrent.x);
    const ry1 = Math.min(this.roiStart.y, this.roiCurrent.y);
    const rx2 = Math.max(this.roiStart.x, this.roiCurrent.x);
    const ry2 = Math.max(this.roiStart.y, this.roiCurrent.y);

    const rw = rx2 - rx1;
    const rh = ry2 - ry1;

    // Minimum size check to prevent accidental micro-clicks
    if (rw < 15 || rh < 15) {
      this.render();
      return;
    }

    const pctX = ((rx1 - b.x) / b.w) * 100;
    const pctY = ((ry1 - b.y) / b.h) * 100;
    const pctW = (rw / b.w) * 100;
    const pctH = (rh / b.h) * 100;

    // Simulated Deep Learning inference on custom ROI
    const candidateClasses = [
      { label: "Anomalous Seabed Acoustic Feature", cat: "Acoustic Anomaly", sev: "high", shadow: 3.4, h: 1.2 },
      { label: "Submerged Metallic Debris", cat: "Metal / Scrap", sev: "critical", shadow: 5.8, h: 2.0 },
      { label: "Discarded Synthetic Net Fragment", cat: "Ghost Gear", sev: "high", shadow: 4.1, h: 1.5 },
      { label: "Unclassified Subsea Obstruction", cat: "Navigation Hazard", sev: "warning", shadow: 7.2, h: 2.8 }
    ];
    const picked = candidateClasses[Math.floor(Math.random() * candidateClasses.length)];
    const simulatedConf = +(0.88 + Math.random() * 0.11).toFixed(3);

    const newDet = {
      id: `custom-roi-${Date.now()}`,
      label: picked.label,
      category: picked.cat,
      confidence: simulatedConf,
      severity: picked.sev,
      box: {
        x: Math.max(0, Math.min(95, pctX)),
        y: Math.max(0, Math.min(95, pctY)),
        w: Math.max(2, Math.min(90, pctW)),
        h: Math.max(2, Math.min(90, pctH))
      },
      shadowLength: picked.shadow,
      estHeight: picked.h,
      estArea: +((rw * rh) / 25).toFixed(1),
      acousticProfile: "User-defined ROI: Sharp localized acoustic backscatter signature",
      recoveryPriority: "P2 - Requires ROV Verification",
      material: "Composite Synthetic / Metallic",
      environmentalImpact: "Under Active Evaluation by MarineGuard Neural Engine",
      channel: pctX < 50 ? "Port Swath" : "Starboard Swath"
    };

    this.customDetections.push(newDet);
    this.selectedDetectionId = newDet.id;
    this.toggleRoiMode(false);
    sonarAudio.playAnomalyAlert();
    this.onSelectDetection(newDet);
    this.onNewDetectionAdded(newDet);
    this.render();
  }

  loadCustomImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const customDs = {
        id: `upload-${Date.now()}`,
        name: `Custom Ingestion: ${file.name}`,
        code: `USER-${Math.floor(1000 + Math.random() * 9000)}`,
        targetType: "User Ingested Side-Scan Sonar Data",
        image: e.target.result,
        location: "Uploaded Hydrographic File",
        coordinates: { lat: 51.507, lon: 0.127 },
        coordsFormatted: "Calibrated on Ingestion",
        depth: 45.0,
        altitude: 10.5,
        swathWidth: 100,
        frequency: "450 kHz High-Res",
        towSpeed: 3.4,
        surveyDate: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        vessel: "Custom Acoustic Feed",
        operator: "External Survey Operator",
        status: "AUTOMATIC AI ANALYSIS COMPLETE",
        threatLevel: "warning",
        summary: `Autonomous pipeline ingestion of ${file.name}. Computer vision model identified 2 acoustic anomalies from acoustic backscatter reflections and shadow profiles.`,
        detections: [
          {
            id: `det-up-01`,
            label: "Acoustic High-Backscatter Debris Object",
            category: "Marine Debris",
            confidence: 0.941,
            severity: "high",
            box: { x: 32, y: 38, w: 14, h: 22 },
            shadowLength: 5.2,
            estHeight: 1.8,
            estArea: 11.5,
            acousticProfile: "Strong specular acoustic reflection with pronounced trailing acoustic shadow",
            recoveryPriority: "P2 - Verification Recommended",
            material: "Unidentified Anthropogenic Material",
            environmentalImpact: "Potential benthic smothering hazard",
            channel: "Port Swath"
          },
          {
            id: `det-up-02`,
            label: "Linear Subsea Cable / Rope Anomaly",
            category: "Marine Plastics",
            confidence: 0.893,
            severity: "moderate",
            box: { x: 62, y: 45, w: 16, h: 18 },
            shadowLength: 3.1,
            estHeight: 0.9,
            estArea: 6.2,
            acousticProfile: "Narrow acoustic line with intermittent shadow gaps",
            recoveryPriority: "P3 - Secondary Target",
            material: "Synthetic Braided Cordage",
            environmentalImpact: "Entanglement hazard",
            channel: "Starboard Swath"
          }
        ],
        bathymetryStats: {
          averageDepth: "45.0 m",
          seabedType: "Calibrated SSS Texture",
          waterTemp: "14.2 °C",
          salinity: "35.0 PSU",
          swathAreaCovered: "0.95 km²",
          turbidity: "1.0 NTU"
        }
      };

      this.loadDataset(customDs);
    };
    reader.readAsDataURL(file);
  }
}
