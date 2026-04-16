"use client";

import { useRef, useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function VideoUpload() {
  const fileInputRef = useRef(null);
  const [videoFile, setVideoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultVideoUrl, setResultVideoUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(null);
  const [stats, setStats] = useState(null);

  /* ── Select / drop video ─────────────────────────────────── */
  const handleFile = useCallback((file) => {
    if (!file) return;
    const validTypes = [
      "video/mp4",
      "video/avi",
      "video/x-msvideo",
      "video/quicktime",
      "video/webm",
      "video/x-matroska",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|avi|mov|webm|mkv)$/i)) {
      setError("Unsupported video format. Use MP4, AVI, MOV, or WebM.");
      return;
    }
    setError(null);
    setResultVideoUrl(null);
    setStats(null);
    setVideoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  const onFileChange = (e) => handleFile(e.target.files[0]);
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  /* ── Run video analysis ──────────────────────────────────── */
  const runVideoAnalysis = async () => {
    if (!videoFile) return;
    setLoading(true);
    setError(null);
    setProgress("Uploading video...");
    setResultVideoUrl(null);
    setStats(null);

    try {
      const formData = new FormData();
      formData.append("file", videoFile);

      setProgress("Processing video frame by frame... This may take a while.");

      const res = await fetch(`${API_URL}/predict/video`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        // Try to parse JSON error, fallback to text for HTML error pages
        let errMsg = `Server error ${res.status}`;
        try {
          const ct = res.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            const errData = await res.json();
            errMsg = errData.detail || errMsg;
          } else if (res.status === 404) {
            errMsg = "Video processing endpoint not available. The backend may still be loading — please wait a moment and try again.";
          } else if (res.status === 503 || res.status === 502) {
            errMsg = "The backend is currently unavailable. It may be waking up — please try again in 30 seconds.";
          }
        } catch (e) { /* ignore parse errors */ }
        throw new Error(errMsg);
      }

      // Check if we got JSON stats header
      const contentType = res.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        // Error case from backend
        const data = await res.json();
        throw new Error(data.detail || "Video processing failed");
      }

      // Get stats from custom header
      const statsHeader = res.headers.get("X-Video-Stats");
      if (statsHeader) {
        try {
          setStats(JSON.parse(statsHeader));
        } catch (e) {
          // ignore parse errors
        }
      }

      // Binary video response
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultVideoUrl(url);
      setProgress(null);
    } catch (err) {
      setError(err.message || "Failed to process video.");
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  /* ── Reset ───────────────────────────────────────────────── */
  const reset = () => {
    setVideoFile(null);
    setPreviewUrl(null);
    setResultVideoUrl(null);
    setError(null);
    setProgress(null);
    setStats(null);
  };

  return (
    <div className="video-upload-wrapper">
      {/* ── LEFT: Upload Panel ─────────────────────────── */}
      <div className="video-upload-panel glass glow-border">
        <div className="panel-label">01 — Input Video</div>

        {error && (
          <div
            style={{
              padding: "12px 20px",
              borderRadius: 10,
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.3)",
              color: "var(--red)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.8rem",
              marginBottom: "1rem",
            }}
          >
            {error}
          </div>
        )}

        {/* Drop zone */}
        <div
          className={`drop-zone ${dragging ? "dragging" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={previewUrl ? { border: "none", cursor: "pointer", minHeight: "60px", flex: "none" } : {}}
        >
          {!previewUrl ? (
            <>
              <div className="drop-zone-icon">🎬</div>
              <div className="drop-zone-text">
                Drop video here or click to browse
              </div>
              <div className="drop-zone-hint">
                MP4, AVI, MOV, WEBM — up to 100MB
              </div>
            </>
          ) : (
            <div className="drop-zone-text" style={{ fontSize: "0.8rem" }}>
              Click or drop to replace video
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/avi,video/quicktime,video/webm,video/x-matroska,.mp4,.avi,.mov,.webm,.mkv"
          onChange={onFileChange}
          style={{ display: "none" }}
        />

        {/* Input video preview */}
        {previewUrl && !resultVideoUrl && (
          <div className="video-preview-container">
            <video
              src={previewUrl}
              controls
              style={{
                width: "100%",
                maxHeight: "350px",
                borderRadius: "10px",
                background: "#000",
              }}
            />
            <div className="video-file-info">
              <span className="video-file-name">
                📁 {videoFile?.name}
              </span>
              <span className="video-file-size">
                {videoFile ? (videoFile.size / (1024 * 1024)).toFixed(1) + " MB" : ""}
              </span>
            </div>
          </div>
        )}

        {/* Processing indicator */}
        {loading && (
          <div className="video-processing-indicator">
            <div className="processing-spinner-ring">
              <div className="processing-ring-inner" />
            </div>
            <div className="processing-text">{progress}</div>
            <div className="processing-subtext">
              Each frame is analyzed by the detection model
            </div>
          </div>
        )}

        {/* Run / Reset buttons */}
        <div className="camera-actions">
          {videoFile && !loading && !resultVideoUrl && (
            <button className="run-btn" onClick={runVideoAnalysis}>
              ▶ PROCESS VIDEO
            </button>
          )}
          {videoFile && !loading && (
            <button className="camera-secondary-btn" onClick={reset}>
              ↻ RESET
            </button>
          )}
        </div>
      </div>

      {/* ── RIGHT: Results Panel ───────────────────────── */}
      <div className="video-results-panel">
        {/* Processed video output */}
        <div className="glass glow-border" style={{ padding: "1.5rem" }}>
          <div className="panel-label">02 — Processed Output</div>

          {resultVideoUrl ? (
            <>
              <div className="video-preview-container">
                <video
                  src={resultVideoUrl}
                  controls
                  autoPlay
                  loop
                  style={{
                    width: "100%",
                    maxHeight: "400px",
                    borderRadius: "10px",
                    background: "#000",
                  }}
                />
              </div>

              {/* Download button */}
              <a
                href={resultVideoUrl}
                download="mask_detection_output.mp4"
                className="run-btn"
                style={{
                  textDecoration: "none",
                  textAlign: "center",
                  marginTop: "1rem",
                  display: "flex",
                  background: "linear-gradient(135deg, var(--green), var(--teal))",
                }}
              >
                ⬇ DOWNLOAD PROCESSED VIDEO
              </a>
            </>
          ) : (
            <div className="awaiting">
              <div className="awaiting-icon">🎬</div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8rem",
                }}
              >
                Upload a video and run processing to see annotated output...
              </span>
            </div>
          )}
        </div>

        {/* Stats panel */}
        {stats && (
          <div className="glass glow-border" style={{ padding: "1.5rem", marginTop: "1.5rem" }}>
            <div className="panel-label">03 — Video Analysis Stats</div>
            <div className="summary-grid">
              <div className="summary-stat">
                <div>
                  <span className="dot dot-green" />
                  <span className="stat-name">With Mask</span>
                </div>
                <div className="stat-num">{stats.with_mask || 0}</div>
              </div>
              <div className="summary-stat">
                <div>
                  <span className="dot dot-red" />
                  <span className="stat-name">Without Mask</span>
                </div>
                <div className="stat-num">{stats.without_mask || 0}</div>
              </div>
              <div className="summary-stat">
                <div>
                  <span className="dot dot-amber" />
                  <span className="stat-name">Incorrect</span>
                </div>
                <div className="stat-num">{stats.mask_weared_incorrect || 0}</div>
              </div>
            </div>
            <div className="total-bar">
              <div className="total-label">Total Frames Processed</div>
              <div className="total-num">{stats.frames_processed || 0}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
