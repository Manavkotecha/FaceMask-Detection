"use client";

import { useRef, useState, useCallback } from "react";
import OrbitalSphere from "./OrbitalSphere";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const COLORS = {
  with_mask: "#4ade80",
  without_mask: "#f87171",
  mask_weared_incorrect: "#fbbf24",
};

const LABELS = {
  with_mask: "WITH MASK",
  without_mask: "NO MASK",
  mask_weared_incorrect: "INCORRECT",
};

const ICONS = {
  with_mask: "✓",
  without_mask: "✕",
  mask_weared_incorrect: "⚠",
};

export default function Detector() {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);

  /* ── Select / drop image ────────────────────────────────────── */
  const handleFile = useCallback((file) => {
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Unsupported image type. Use JPEG, PNG, or WebP.");
      return;
    }
    setError(null);
    setResult(null);
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, []);

  const onFileChange = (e) => handleFile(e.target.files[0]);
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  /* ── Run analysis ──────────────────────────────────────────── */
  const runAnalysis = async () => {
    if (!imageFile) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      drawBoxes(data.detections);
    } catch (err) {
      setError(err.message || "Failed to connect to the backend.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Draw bounding boxes on canvas ─────────────────────────── */
  const drawBoxes = (detections) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    // Wait for image to be rendered
    requestAnimationFrame(() => {
      const dispW = img.clientWidth;
      const dispH = img.clientHeight;
      const natW = img.naturalWidth;
      const natH = img.naturalHeight;

      if (!natW || !natH) return;

      canvas.width = dispW;
      canvas.height = dispH;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, dispW, dispH);

      // object-fit: contain scaling logic
      const scale = Math.min(dispW / natW, dispH / natH);
      const renderW = natW * scale;
      const renderH = natH * scale;

      // Calculate centering offsets (letterboxing/pillarboxing)
      const offsetX = (dispW - renderW) / 2;
      const offsetY = (dispH - renderH) / 2;

      for (const det of detections) {
        const [x1, y1, x2, y2] = det.bbox;
        const sx = (x1 * scale) + offsetX;
        const sy = (y1 * scale) + offsetY;
        const sw = (x2 - x1) * scale;
        const sh = (y2 - y1) * scale;
        const color = COLORS[det.label] || "#38bdf8";

        // Box
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(sx, sy, sw, sh);

        // Label background
        const text = `${ICONS[det.label]} ${LABELS[det.label]} ${(det.confidence * 100).toFixed(1)}`;
        ctx.font = "bold 11px 'JetBrains Mono', monospace";
        const tm = ctx.measureText(text);
        const labelH = 18;
        ctx.fillStyle = color;
        ctx.fillRect(sx, sy - labelH, tm.width + 10, labelH);

        // Label text
        ctx.fillStyle = "#0a0e1a";
        ctx.fillText(text, sx + 5, sy - 5);
      }
    });
  };

  return (
    <section className="detector" id="detector">
      {/* Rotating Sphere header */}
      <div style={{ position: "relative", height: "300px", marginBottom: "2rem", width: "100%" }}>
        <OrbitalSphere />
      </div>

      <h2 className="section-heading">Try The Detector</h2>
      <p className="section-subtext" style={{ marginLeft: "auto", marginRight: "auto" }}>
        Upload an image below to see the Faster R-CNN model in action
      </p>

      {error && (
        <div
          style={{
            maxWidth: 600,
            margin: "0 auto 1.5rem",
            padding: "12px 20px",
            borderRadius: 10,
            background: "rgba(248,113,113,0.1)",
            border: "1px solid rgba(248,113,113,0.3)",
            color: "var(--red)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.8rem",
          }}
        >
          {error}
        </div>
      )}

      <div className="detector-grid">
        {/* ── LEFT: Upload Panel ─────────────────────────────── */}
        <div className="upload-panel glass glow-border">
          <div className="panel-label">01 — Input Image</div>

          {/* Drop zone / replace zone */}
          <div
            className={`drop-zone ${dragging ? "dragging" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            style={previewUrl ? { border: "none", cursor: "pointer" } : {}}
          >
            {!previewUrl ? (
              <>
                <div className="drop-zone-icon">⬆</div>
                <div className="drop-zone-text">
                  Drop image here or click to browse
                </div>
                <div className="drop-zone-hint">PNG, JPG, WEBP — any size</div>
              </>
            ) : (
              <div className="drop-zone-text" style={{ fontSize: "0.8rem" }}>
                Click or drop to replace image
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFileChange}
            style={{ display: "none" }}
          />

          {/* Preview with bounding-box canvas overlay */}
          {previewUrl && (
            <div className="preview-container">
              <img
                ref={imgRef}
                src={previewUrl}
                alt="Upload preview"
                onLoad={() => {
                  if (result) drawBoxes(result.detections);
                }}
              />
              <canvas ref={canvasRef} />
            </div>
          )}

          {/* Run button */}
          <button
            className="run-btn"
            onClick={runAnalysis}
            disabled={!imageFile || loading}
          >
            {loading ? (
              <>
                <span className="spinner" /> ANALYZING...
              </>
            ) : (
              <>▶ RUN ANALYSIS</>
            )}
          </button>
        </div>

        {/* ── RIGHT: Results ─────────────────────────────────── */}
        <div className="results-col">
          {/* Summary panel */}
          <div className="summary-panel glass glow-border">
            <div className="panel-label">02 — Detection Summary</div>

            {result ? (
              <>
                <div className="summary-grid">
                  <div className="summary-stat">
                    <div>
                      <span className="dot dot-green" />
                      <span className="stat-name">With Mask</span>
                    </div>
                    <div className="stat-num">{result.with_mask}</div>
                  </div>
                  <div className="summary-stat">
                    <div>
                      <span className="dot dot-red" />
                      <span className="stat-name">Without Mask</span>
                    </div>
                    <div className="stat-num">{result.without_mask}</div>
                  </div>
                  <div className="summary-stat">
                    <div>
                      <span className="dot dot-amber" />
                      <span className="stat-name">Mask Weared Incorrect</span>
                    </div>
                    <div className="stat-num">
                      {result.mask_weared_incorrect}
                    </div>
                  </div>
                </div>

                <div className="total-bar">
                  <div className="total-label">Total Detections</div>
                  <div className="total-num">{result.total_detections}</div>
                </div>
              </>
            ) : (
              <div className="awaiting">
                <div className="awaiting-icon">🖥</div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                  Awaiting analysis...
                </span>
              </div>
            )}
          </div>

          {/* Confidence panel */}
          <div className="confidence-panel glass glow-border">
            <div className="panel-label">03 — Confidence Scores</div>

            <div className="confidence-scroll-area">
              {result && result.detections.length > 0 ? (
                result.detections.map((det, i) => (
                  <div key={i} className="detection-item">
                    <div className="detection-header">
                      <span className={`detection-label ${det.label}`}>
                        {ICONS[det.label]} {LABELS[det.label]} #{i + 1}
                      </span>
                      <span className={`detection-score ${det.label}`}>
                        {(det.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="score-bar">
                      <div
                        className={`score-bar-fill ${det.label}`}
                        style={{ width: `${det.confidence * 100}%` }}
                      />
                    </div>
                    <div className="detection-bbox">
                      Box [{det.bbox.map((v) => Math.round(v)).join(", ")}]
                    </div>
                  </div>
                ))
              ) : (
                <div className="awaiting" style={{ padding: "1.5rem" }}>
                  {/* Placeholder bars */}
                  {[80, 60, 45].map((w, i) => (
                    <div key={i} className="score-bar" style={{ width: "100%", marginBottom: 12 }}>
                      <div
                        style={{
                          height: 6,
                          width: `${w}%`,
                          borderRadius: 3,
                          background: "rgba(148,163,184,0.12)",
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "var(--green)" }} />
          with mask
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "var(--red)" }} />
          without mask
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "var(--amber)" }} />
          mask weared incorrect
        </div>
      </div>
    </section>
  );
}
