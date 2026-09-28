// MarineGuard AI - Geospatial Bathymetric Map & Autonomous Survey Tracker
import { sonarAudio } from './audioSonar.js';

export class BathymetricMapViewer {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.missions = options.missions || [];
    this.activeMission = null;
    this.onSelectMission = options.onSelectMission || (() => {});
    this.onSelectDetection = options.onSelectDetection || (() => {});
    this.selectedPin = null;
    this.selectedDetectionId = null;
    this.confidenceThreshold = 0.50;
    this.activeFilter = 'all';

    // Map view state (Center in geographic map space)
    this.view = {
      x: 0,
      y: 0,
      zoom: 1.0,
      isDragging: false,
      lastMouse: { x: 0, y: 0 }
    };

    // AUV Live Movement Animation
    this.auvPosition = 0; // 0 to 1 along survey path
    this.auvSpeed = 0.0008;
    this.animId = null;

    this.initEvents();
    this.startAnimation();
  }

  initEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.view.isDragging = true;
      this.view.lastMouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.view.isDragging) return;
      const dx = e.clientX - this.view.lastMouse.x;
      const dy = e.clientY - this.view.lastMouse.y;
      this.view.x += dx;
      this.view.y += dy;
      this.view.lastMouse = { x: e.clientX, y: e.clientY };
      this.render();
    });

    window.addEventListener('mouseup', () => {
      this.view.isDragging = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 0.85;
      this.view.zoom = Math.min(Math.max(0.6, this.view.zoom * factor), 3.0);
      this.render();
    }, { passive: false });

    this.canvas.addEventListener('click', (e) => {
      this.handleMapClick(e);
    });

    window.addEventListener('resize', () => {
      this.resize();
      this.render();
    });
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.displayWidth = rect.width;
    this.displayHeight = rect.height;
  }

  setActiveMission(mission) {
    this.activeMission = mission;
    this.render();
  }

  setConfidenceThreshold(threshold) {
    this.confidenceThreshold = parseFloat(threshold);
    this.render();
  }

  setSelectedDetection(detId) {
    this.selectedDetectionId = detId;
    this.render();
  }

  setFilter(category) {
    this.activeFilter = category;
    this.render();
  }

  startAnimation() {
    const loop = () => {
      this.auvPosition = (this.auvPosition + this.auvSpeed) % 1;
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  render() {
    if (!this.displayWidth || !this.displayHeight) {
      this.resize();
    }
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // Deep bathymetric ocean background
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h));
    bgGrad.addColorStop(0, '#0a172c');
    bgGrad.addColorStop(1, '#030814');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Apply Map Translation & Zoom
    ctx.save();
    ctx.translate(w / 2 + this.view.x, h / 2 + this.view.y);
    ctx.scale(this.view.zoom, this.view.zoom);

    // Draw Bathymetric Graticules & Nautical Grid
    this.drawNauticalGrids(ctx, w, h);

    // Draw Depth Contour Isolines
    this.drawBathymetricContours(ctx);

    // Draw Survey Swath Transects & AUV Lawnmower Pattern
    this.drawSurveySwathPattern(ctx);

    // Draw Live AUV (Autonomous Underwater Vehicle) Tracker
    this.drawAuvVehicle(ctx);

    // Draw Mission Markers & Detected Debris Pins
    this.drawMissionPins(ctx);

    ctx.restore();

    // Draw Static HUD Elements (Compass Rose, Depth Profile, Scale)
    this.drawMapHud(ctx, w, h);

    ctx.restore();
  }

  drawNauticalGrids(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.08)';
    ctx.lineWidth = 1;

    const gridSize = 80;
    const range = 2400;

    for (let x = -range; x <= range; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, -range);
      ctx.lineTo(x, range);
      ctx.stroke();
    }

    for (let y = -range; y <= range; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(-range, y);
      ctx.lineTo(range, y);
      ctx.stroke();
    }

    // Coordinate text labels
    ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.font = "9px 'JetBrains Mono', monospace";
    for (let x = -range; x <= range; x += gridSize * 2) {
      ctx.fillText(`${(54.0 + (x / 2000)).toFixed(2)}°N`, x + 4, 12);
    }
    ctx.restore();
  }

  drawBathymetricContours(ctx) {
    ctx.save();
    const contours = [
      { depth: "20m", r: 160, color: "rgba(14, 165, 233, 0.25)" },
      { depth: "40m", r: 280, color: "rgba(14, 165, 233, 0.2)" },
      { depth: "60m", r: 420, color: "rgba(2, 132, 199, 0.15)" },
      { depth: "80m", r: 580, color: "rgba(3, 105, 161, 0.12)" },
      { depth: "120m", r: 760, color: "rgba(7, 89, 133, 0.08)" }
    ];

    contours.forEach(c => {
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([8, 6]);

      // Draw irregular organic contour circle
      ctx.beginPath();
      const points = 32;
      for (let i = 0; i <= points; i++) {
        const theta = (i / points) * Math.PI * 2;
        const noise = Math.sin(theta * 3) * 20 + Math.cos(theta * 5) * 15;
        const radius = c.r + noise;
        const px = Math.cos(theta) * radius * 1.4;
        const py = Math.sin(theta) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Depth contour text label
      ctx.fillStyle = c.color;
      ctx.font = "9px 'Space Grotesk', sans-serif";
      ctx.fillText(`-${c.depth} ISOBATH`, c.r * 1.3, -10);
    });
    ctx.setLineDash([]);
    ctx.restore();
  }

  drawSurveySwathPattern(ctx) {
    ctx.save();
    const waypoints = this.getSurveyWaypoints();

    // Swath Coverage Corridor
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.1)';
    ctx.lineWidth = 42;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    waypoints.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    // Centerline trajectory
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.55)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Waypoint dots
    waypoints.forEach((pt, i) => {
      ctx.fillStyle = 'rgba(0, 242, 254, 0.8)';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.fillText(`WP-0${i + 1}`, pt.x + 6, pt.y - 4);
    });
    ctx.restore();
  }

  getSurveyWaypoints() {
    return [
      { x: -320, y: -160 },
      { x: 300, y: -160 },
      { x: 300, y: -60 },
      { x: -300, y: -60 },
      { x: -300, y: 40 },
      { x: 320, y: 40 },
      { x: 320, y: 140 },
      { x: -320, y: 140 }
    ];
  }

  drawAuvVehicle(ctx) {
    ctx.save();
    const waypoints = this.getSurveyWaypoints();
    const totalLegs = waypoints.length - 1;
    const progress = this.auvPosition * totalLegs;
    const legIdx = Math.floor(progress);
    const legFrac = progress - legIdx;

    const p1 = waypoints[legIdx];
    const p2 = waypoints[Math.min(legIdx + 1, totalLegs)];

    const curX = p1.x + (p2.x - p1.x) * legFrac;
    const curY = p1.y + (p2.y - p1.y) * legFrac;
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    // Sonar Beam Swath ping cone projecting from AUV
    ctx.save();
    ctx.translate(curX, curY);
    ctx.rotate(angle);

    const beamGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 80);
    beamGrad.addColorStop(0, 'rgba(0, 242, 254, 0.5)');
    beamGrad.addColorStop(1, 'rgba(0, 242, 254, 0)');

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 60, -Math.PI / 2.5, Math.PI / 2.5);
    ctx.closePath();
    ctx.fill();

    // AUV Vehicle Icon
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();

    // Propeller wake glow
    ctx.fillStyle = '#00f2fe';
    ctx.beginPath();
    ctx.arc(-8, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Ping acoustic ripple ring
    const ringRadius = (Date.now() / 25) % 60;
    ctx.strokeStyle = `rgba(0, 242, 254, ${1 - ringRadius / 60})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(curX, curY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    // AUV HUD Badge
    ctx.fillStyle = 'rgba(7, 13, 24, 0.9)';
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 1;
    ctx.fillRect(curX + 16, curY - 26, 140, 24);
    ctx.strokeRect(curX + 16, curY - 26, 140, 24);

    ctx.fillStyle = '#00f2fe';
    ctx.font = "bold 9px 'Space Grotesk', sans-serif";
    ctx.fillText("AUV NAUTILUS-X4 [SURVEYING]", curX + 22, curY - 10);

    ctx.restore();
  }

  drawMissionPins(ctx) {
    ctx.save();
    const pinLocations = [
      { id: "mission-ghost-net", x: -140, y: -60, mission: this.missions[0] },
      { id: "mission-cargo-drums", x: 120, y: 40, mission: this.missions[1] },
      { id: "mission-shipwreck", x: 220, y: -160, mission: this.missions[2] }
    ];

    this.activePinBounds = [];

    // 1. Draw Mission Hubs
    pinLocations.forEach(p => {
      if (!p.mission) return;

      const isSelected = this.activeMission && this.activeMission.id === p.mission.id;
      let color = p.mission.threatLevel === 'critical' ? '#ef4444' : p.mission.threatLevel === 'warning' ? '#f59e0b' : '#38bdf8';

      // Pulse circle
      const pulse = Math.sin(Date.now() / 250) * 3;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = isSelected ? 16 : 6;

      ctx.beginPath();
      ctx.arc(p.x, p.y, isSelected ? 8 + pulse : 6, 0, Math.PI * 2);
      ctx.fill();

      // Outer target ring
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
      ctx.stroke();

      // Mission Label Banner
      ctx.fillStyle = isSelected ? '#0c2242' : '#060e1d';
      ctx.strokeStyle = isSelected ? '#38bdf8' : color;
      ctx.lineWidth = 1;

      const title = p.mission.code;
      const sub = p.mission.targetType;
      ctx.font = "bold 9.5px 'Space Grotesk', sans-serif";
      const bw = Math.max(ctx.measureText(title).width, ctx.measureText(sub).width) + 16;

      ctx.fillRect(p.x - bw / 2, p.y - 44, bw, 26);
      ctx.strokeRect(p.x - bw / 2, p.y - 44, bw, 26);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(title, p.x, p.y - 32);

      ctx.fillStyle = '#8da2be';
      ctx.font = "8px 'Space Grotesk', sans-serif";
      ctx.fillText(sub, p.x, p.y - 21);

      this.activePinBounds.push({
        type: 'mission',
        id: p.mission.id,
        mission: p.mission,
        x: p.x,
        y: p.y,
        radius: 18
      });
    });

    // 2. Draw Individual Detection Anomaly Markers for Active Mission
    if (this.activeMission && this.activeMission.detections) {
      const activeLoc = pinLocations.find(p => p.id === this.activeMission.id) || { x: 0, y: 0 };
      
      this.activeMission.detections.forEach((det, idx) => {
        // Filter by Confidence Threshold
        if (det.confidence < this.confidenceThreshold) return;

        // Position offset based on detection relative box
        const dx = activeLoc.x + (det.box.x - 50) * 2.2 + (idx % 2 === 0 ? 34 : -34);
        const dy = activeLoc.y + (det.box.y - 50) * 1.6 + (idx * 14 - 18);

        const isDetSelected = this.selectedDetectionId === det.id;
        const detColor = det.severity === 'critical' ? '#ef4444' : '#f59e0b';

        // Connect line from mission hub to anomaly
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(activeLoc.x, activeLoc.y);
        ctx.lineTo(dx, dy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Anomaly point
        ctx.fillStyle = detColor;
        ctx.beginPath();
        ctx.arc(dx, dy, isDetSelected ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();

        if (isDetSelected) {
          // Targeting brackets around selected detection
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(dx, dy, 10, 0, Math.PI * 2);
          ctx.stroke();

          // Selection tag
          ctx.fillStyle = '#060e1d';
          ctx.fillRect(dx + 12, dy - 12, 114, 20);
          ctx.strokeStyle = '#f59e0b';
          ctx.strokeRect(dx + 12, dy - 12, 114, 20);

          ctx.fillStyle = '#f59e0b';
          ctx.font = "bold 8.5px 'JetBrains Mono', monospace";
          ctx.textAlign = 'left';
          ctx.fillText(`TARGET #${det.id}`, dx + 16, dy + 1);
        } else {
          // Subtle ID tag
          ctx.fillStyle = 'rgba(141, 162, 190, 0.85)';
          ctx.font = "8px 'JetBrains Mono', monospace";
          ctx.textAlign = 'left';
          ctx.fillText(`#${det.id}`, dx + 8, dy + 3);
        }

        this.activePinBounds.push({
          type: 'detection',
          id: det.id,
          detection: det,
          x: dx,
          y: dy,
          radius: 14
        });
      });
    }

    ctx.restore();
  }

  drawMapHud(ctx, w, h) {
    ctx.save();
    // Nautical Compass Rose (top-right)
    const cx = w - 60;
    const cy = 60;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    ctx.stroke();

    // North Pointer Needle
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 28);
    ctx.lineTo(cx - 5, cy);
    ctx.lineTo(cx + 5, cy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(cx, cy + 28);
    ctx.lineTo(cx - 5, cy);
    ctx.lineTo(cx + 5, cy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 10px 'Space Grotesk', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("N", cx, cy - 34);

    // Bottom-left Hydrographic Depth Legend
    const lx = 20;
    const ly = h - 60;
    ctx.fillStyle = 'rgba(7, 13, 24, 0.85)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1;
    ctx.fillRect(lx, ly, 220, 44);
    ctx.strokeRect(lx, ly, 220, 44);

    ctx.fillStyle = '#38bdf8';
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.textAlign = 'left';
    ctx.fillText("BATHYMETRIC CONTOUR DEPTH", lx + 12, ly + 16);

    const grad = ctx.createLinearGradient(lx + 12, 0, lx + 200, 0);
    grad.addColorStop(0, '#0ea5e9');
    grad.addColorStop(0.5, '#0369a1');
    grad.addColorStop(1, '#082f49');
    ctx.fillStyle = grad;
    ctx.fillRect(lx + 12, ly + 22, 196, 8);

    ctx.fillStyle = '#94a3b8';
    ctx.font = "8px 'JetBrains Mono', monospace";
    ctx.fillText("-10m", lx + 12, ly + 38);
    ctx.fillText("-60m", lx + 100, ly + 38);
    ctx.fillText("-150m (Deep)", lx + 160, ly + 38);

    ctx.restore();
  }

  handleMapClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const w = this.displayWidth;
    const h = this.displayHeight;

    // Convert screen coordinates to map coordinates
    const mapX = (mouseX - (w / 2 + this.view.x)) / this.view.zoom;
    const mapY = (mouseY - (h / 2 + this.view.y)) / this.view.zoom;

    if (this.activePinBounds) {
      for (const pin of this.activePinBounds) {
        const dist = Math.hypot(mapX - pin.x, mapY - pin.y);
        if (dist <= pin.radius) {
          sonarAudio.playAnomalyAlert();
          if (pin.type === 'detection') {
            this.selectedDetectionId = pin.detection.id;
            this.render();
            this.onSelectDetection(pin.detection);
          } else {
            this.setActiveMission(pin.mission);
            this.onSelectMission(pin.mission);
          }
          return;
        }
      }
    }
  }

  centerOnMission(mission) {
    const pinLocations = {
      "mission-ghost-net": { x: -140, y: -60 },
      "mission-cargo-drums": { x: 120, y: 40 },
      "mission-shipwreck": { x: 220, y: -160 }
    };

    const target = pinLocations[mission.id] || { x: 0, y: 0 };
    this.view.x = -target.x * this.view.zoom;
    this.view.y = -target.y * this.view.zoom;
    this.setActiveMission(mission);
    this.render();
  }
}
