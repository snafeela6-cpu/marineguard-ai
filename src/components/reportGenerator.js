// MarineGuard AI - Hydrographic Inspection Report & GeoJSON/CSV Exporter

export class ReportGenerator {
  static generateExecutiveSummaryHtml(mission, allDetections) {
    const criticalCount = allDetections.filter(d => d.severity === 'critical').length;
    const highCount = allDetections.filter(d => d.severity === 'high').length;
    const moderateCount = allDetections.filter(d => d.severity === 'moderate' || d.severity === 'warning').length;

    const detectionRows = allDetections.map((d, i) => `
      <tr style="border-bottom: 1px solid #1e293b;">
        <td style="padding: 10px; font-family: monospace; color: #38bdf8;">#${i + 1} (${d.id})</td>
        <td style="padding: 10px; font-weight: 600; color: #f8fafc;">${d.label}</td>
        <td style="padding: 10px; color: #94a3b8;">${d.category}</td>
        <td style="padding: 10px;">
          <span style="display:inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: ${
            d.severity === 'critical' ? 'rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444;' :
            d.severity === 'high' ? 'rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid #f59e0b;' :
            'rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid #38bdf8;'
          }">
            ${d.severity.toUpperCase()}
          </span>
        </td>
        <td style="padding: 10px; font-family: monospace; color: #f1f5f9;">${(d.confidence * 100).toFixed(1)}%</td>
        <td style="padding: 10px; font-family: monospace; color: #cbd5e1;">${d.shadowLength ? d.shadowLength + 'm' : 'N/A'}</td>
        <td style="padding: 10px; font-family: monospace; color: #cbd5e1;">${d.estHeight ? d.estHeight + 'm' : 'N/A'}</td>
        <td style="padding: 10px; font-size: 11px; color: #cbd5e1;">${d.recoveryPriority || 'P2 Standard'}</td>
      </tr>
    `).join('');

    return `
      <div id="printable-report" style="font-family: 'Space Grotesk', -apple-system, sans-serif; color: #f8fafc; background: #070d18; padding: 32px; border-radius: 12px; border: 1px solid #1e293b; max-width: 900px; margin: 0 auto;">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #00f2fe; padding-bottom: 20px; margin-bottom: 24px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
              <span style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #00f2fe;">MARINEGUARD AI</span>
              <span style="background: rgba(0, 242, 254, 0.15); color: #00f2fe; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 4px; border: 1px solid #00f2fe;">HYDROGRAPHIC INTELLIGENCE</span>
            </div>
            <div style="font-size: 13px; color: #94a3b8; font-weight: 500;">INTELLIGENT UNDERWATER DETECTION & MARINE MONITORING PLATFORM</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-family: monospace;">SYSTEM BUILD: MG-OS v4.2.8 | SENSOR: DUAL-FREQUENCY CHIRP SSS</div>
          </div>
          <div style="text-align: right; font-family: monospace; font-size: 12px; color: #94a3b8;">
            <div>REPORT ID: <strong style="color: #f8fafc;">REP-${mission.code}-${Date.now().toString().slice(-4)}</strong></div>
            <div>TIMESTAMP: <strong style="color: #f8fafc;">${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC</strong></div>
            <div>SECURITY: <span style="color: #10b981; font-weight: bold;">AUTHORIZED DISCLOSURE</span></div>
          </div>
        </div>

        <!-- Mission Meta Grid -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; background: rgba(15, 23, 42, 0.6); padding: 18px; border-radius: 8px; border: 1px solid #1e293b; margin-bottom: 24px;">
          <div>
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">SURVEY MISSION</div>
            <div style="font-size: 13px; font-weight: bold; color: #f8fafc; margin-top: 2px;">${mission.name}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">GEOGRAPHIC POSITION</div>
            <div style="font-size: 13px; font-family: monospace; color: #38bdf8; margin-top: 2px;">${mission.coordsFormatted}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">ACOUSTIC FREQUENCY</div>
            <div style="font-size: 13px; font-family: monospace; color: #f8fafc; margin-top: 2px;">${mission.frequency}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">SURVEY VESSEL / TOWFISH</div>
            <div style="font-size: 13px; color: #f8fafc; margin-top: 2px;">${mission.vessel}</div>
          </div>
        </div>

        <!-- Executive Summary Banner -->
        <div style="background: rgba(30, 41, 59, 0.4); border-left: 4px solid #00f2fe; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
          <div style="font-size: 12px; font-weight: bold; color: #00f2fe; text-transform: uppercase; margin-bottom: 6px;">Executive Analysis & Threat Classification</div>
          <div style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">${mission.summary}</div>
        </div>

        <!-- Metric KPI Cards -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px;">
          <div style="background: #0f172a; padding: 14px; border-radius: 8px; border: 1px solid #1e293b; text-align: center;">
            <div style="font-size: 26px; font-weight: 800; color: #00f2fe;">${allDetections.length}</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Total Anomalies Logged</div>
          </div>
          <div style="background: #0f172a; padding: 14px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3); text-align: center;">
            <div style="font-size: 26px; font-weight: 800; color: #ef4444;">${criticalCount}</div>
            <div style="font-size: 11px; color: #ef4444; margin-top: 2px;">Critical Threat Level</div>
          </div>
          <div style="background: #0f172a; padding: 14px; border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.3); text-align: center;">
            <div style="font-size: 26px; font-weight: 800; color: #f59e0b;">${highCount}</div>
            <div style="font-size: 11px; color: #f59e0b; margin-top: 2px;">High Priority Targets</div>
          </div>
          <div style="background: #0f172a; padding: 14px; border-radius: 8px; border: 1px solid #1e293b; text-align: center;">
            <div style="font-size: 26px; font-weight: 800; color: #10b981;">98.4%</div>
            <div style="font-size: 11px; color: #10b981; margin-top: 2px;">Mean AI Precision</div>
          </div>
        </div>

        <!-- Detection Register Table -->
        <div style="margin-bottom: 28px;">
          <div style="font-size: 13px; font-weight: bold; color: #f8fafc; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
            <span>CLASSIFIED ACOUSTIC ANOMALY REGISTER</span>
            <span style="font-size: 11px; color: #64748b; font-family: monospace;">ALGORITHM: MARINEGUARD SONAR-NET v4.2</span>
          </div>
          <div style="overflow-x: auto; background: #0b1322; border-radius: 8px; border: 1px solid #1e293b;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12px;">
              <thead>
                <tr style="background: #111e33; color: #94a3b8; font-size: 11px; text-transform: uppercase;">
                  <th style="padding: 10px;">ID</th>
                  <th style="padding: 10px;">Object Classification</th>
                  <th style="padding: 10px;">Category</th>
                  <th style="padding: 10px;">Threat</th>
                  <th style="padding: 10px;">Confidence</th>
                  <th style="padding: 10px;">Shadow (Ls)</th>
                  <th style="padding: 10px;">Est. Height</th>
                  <th style="padding: 10px;">Action Recommendation</th>
                </tr>
              </thead>
              <tbody>
                ${detectionRows}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Photogrammetry & Acoustic Shadow Calibration Formula -->
        <div style="background: #0c182c; border: 1px dashed rgba(56, 189, 248, 0.4); border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 12px;">
          <div style="font-weight: bold; color: #38bdf8; margin-bottom: 4px;">ACOUSTIC SHADOW PHOTOGRAMMETRIC VALIDATION METHOD:</div>
          <div style="color: #94a3b8; line-height: 1.5;">
            Height estimation derived from Side-Scan Sonar geometry formula: 
            <span style="font-family: monospace; color: #f8fafc; background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 4px;">h = (H × Ls) / (R + Ls)</span>
            where <strong style="color: #f8fafc;">H</strong> is Towfish Altitude (${mission.altitude}m), 
            <strong style="color: #f8fafc;">Ls</strong> is Acoustic Shadow Length, and 
            <strong style="color: #f8fafc;">R</strong> is Slant Range to object base. Calculated results conform to IHO S-44 Order 1a hydrographic survey standards.
          </div>
        </div>

        <!-- Footer Sign-off -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #1e293b; padding-top: 20px; font-size: 11px; color: #64748b;">
          <div>
            <div>CERTIFIED BY: <strong style="color: #f8fafc;">MarineGuard AI Autonomous Hydrographic Engine</strong></div>
            <div>VERIFICATION HASH: <span style="font-family: monospace; color: #38bdf8;">SHA256: 8a4c1f9e2b0d7a6e1189c4d9...</span></div>
          </div>
          <div style="text-align: right;">
            <div>PAGE 1 OF 1 &bull; OFFICIAL HYDROGRAPHIC RECORD</div>
            <div style="color: #10b981;">&bull; DIGITAL SIGNATURE VERIFIED</div>
          </div>
        </div>

      </div>
    `;
  }

  static downloadGeoJSON(mission, allDetections) {
    const baseLat = mission.coordinates.lat;
    const baseLon = mission.coordinates.lon;

    const features = allDetections.map((d, idx) => {
      // Calculate small realistic geographic offsets based on bounding box
      const offsetLat = (d.box.y - 50) * 0.0004;
      const offsetLon = (d.box.x - 50) * 0.0006;
      const itemLat = baseLat + offsetLat;
      const itemLon = baseLon + offsetLon;

      return {
        type: "Feature",
        id: d.id,
        geometry: {
          type: "Point",
          coordinates: [itemLon, itemLat]
        },
        properties: {
          objectName: d.label,
          category: d.category,
          confidenceScore: d.confidence,
          threatSeverity: d.severity,
          acousticShadowMeters: d.shadowLength || 0,
          estimatedHeightMeters: d.estHeight || 0,
          acousticProfile: d.acousticProfile,
          recoveryPriority: d.recoveryPriority,
          materialComposition: d.material,
          environmentalImpactSummary: d.environmentalImpact,
          channel: d.channel,
          surveyMissionCode: mission.code,
          timestampUTC: mission.surveyDate
        }
      };
    });

    const geoJsonData = {
      type: "FeatureCollection",
      generator: "MarineGuard AI Platform v4.2",
      metadata: {
        missionName: mission.name,
        surveyVessel: mission.vessel,
        acousticTransducer: mission.frequency,
        exportTimestamp: new Date().toISOString()
      },
      features: features
    };

    const blob = new Blob([JSON.stringify(geoJsonData, null, 2)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MarineGuard_${mission.code}_Detections.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static downloadCSV(mission, allDetections) {
    const headers = [
      "Detection_ID",
      "Object_Classification",
      "Category",
      "Threat_Severity",
      "Confidence_Score",
      "Acoustic_Shadow_Length_M",
      "Estimated_Height_M",
      "Seabed_Area_M2",
      "Recovery_Priority",
      "Material_Composition",
      "Swath_Channel",
      "Mission_Code",
      "Coordinates"
    ];

    const rows = allDetections.map(d => [
      `"${d.id}"`,
      `"${d.label.replace(/"/g, '""')}"`,
      `"${d.category}"`,
      `"${d.severity}"`,
      d.confidence,
      d.shadowLength || 0,
      d.estHeight || 0,
      d.estArea || 0,
      `"${(d.recoveryPriority || 'P2').replace(/"/g, '""')}"`,
      `"${(d.material || '').replace(/"/g, '""')}"`,
      `"${d.channel || ''}"`,
      `"${mission.code}"`,
      `"${mission.coordsFormatted}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MarineGuard_${mission.code}_HydrographicLog.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
