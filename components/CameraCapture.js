"use client";

import { useRef, useState, useCallback, useEffect } from "react";

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

export default function CameraCapture({ onResult }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [flashActive, setFlashActive] = useState(false);

  /* ── Start camera ────────────────────────────────────────── */
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setError(null);
    setCapturedImage(null);
    if (onResult) onResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera permissions in your browser."
          : err.name === "NotFoundError"
          ? "No camera found. Please connect a webcam."
          : `Could not access camera: ${err.message}`
      );
    }
  }, [onResult]);

  /* ── Stop camera ─────────────────────────────────────────── */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  /* ── Cleanup on unmount ──────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  /* ── Capture a frame ─────────────────────────────────────── */
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Flash effect
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    // Mirror the canvas so captured image matches the live mirrored view
    // This ensures bounding box coordinates from the model align with the displayed image
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    // Convert canvas to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setCapturedImage({ url, blob });
          stopCamera();
        }
      },
      "image/jpeg",
      0.92
    );
  }, [stopCamera]);

  /* ── Analyze captured frame ──────────────────────────────── */
  const runAnalysis = async () => {
    if (!capturedImage) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", capturedImage.blob, "capture.jpg");

      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      if (onResult) onResult(data);
      drawBoxes(data.detections);
    } catch (err) {
      setError(err.message || "Failed to connect to the backend.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Draw bounding boxes on overlay ─────────────────────── */
  const drawBoxes = (detections) => {
    const overlay = overlayCanvasRef.current;
    const imgEl = document.getElementById("captured-preview");
    if (!overlay || !imgEl) return;

    requestAnimationFrame(() => {
      const dispW = imgEl.clientWidth;
      const dispH = imgEl.clientHeight;
      const natW = imgEl.naturalWidth;
      const natH = imgEl.naturalHeight;

      if (!natW || !natH) return;

      overlay.width = dispW;
      overlay.height = dispH;
      const ctx = overlay.getContext("2d");
      ctx.clearRect(0, 0, dispW, dispH);

      const scale = Math.min(dispW / natW, dispH / natH);
      const renderW = natW * scale;
      const renderH = natH * scale;
      const offsetX = (dispW - renderW) / 2;
      const offsetY = (dispH - renderH) / 2;

      for (const det of detections) {
        const [x1, y1, x2, y2] = det.bbox;
        const sx = x1 * scale + offsetX;
        const sy = y1 * scale + offsetY;
        const sw = (x2 - x1) * scale;
        const sh = (y2 - y1) * scale;
        const color = COLORS[det.label] || "#38bdf8";

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(sx, sy, sw, sh);

        const text = `${ICONS[det.label]} ${LABELS[det.label]} ${(det.confidence * 100).toFixed(1)}%`;
        ctx.font = "bold 11px 'JetBrains Mono', monospace";
        const tm = ctx.measureText(text);
        const labelH = 18;
        ctx.fillStyle = color;
        ctx.fillRect(sx, sy - labelH, tm.width + 10, labelH);

        ctx.fillStyle = "#0a0e1a";
        ctx.fillText(text, sx + 5, sy - 5);
      }
    });
  };

  /* ── Retake ──────────────────────────────────────────────── */
  const retake = () => {
    setCapturedImage(null);
    setError(null);
    if (onResult) onResult(null);

    // Clear overlay canvas
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    }

    startCamera();
  };

  return (
    <div className="camera-capture-panel">
      <div className="panel-label">01 — Camera Capture</div>

      {cameraError && (
        <div className="camera-error-msg">
          <span className="camera-error-icon">⚠</span>
          {cameraError}
        </div>
      )}

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

      {/* ── Camera Feed / Captured Image ──────────────── */}
      <div className="camera-viewport">
        {!cameraActive && !capturedImage && (
          <div className="camera-placeholder" onClick={startCamera}>
            <div className="camera-placeholder-icon">📷</div>
            <div className="camera-placeholder-text">
              Click to activate camera
            </div>
            <div className="camera-placeholder-hint">
              Requires webcam access permission
            </div>
          </div>
        )}

        {/* Live feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            display: cameraActive ? "block" : "none",
            width: "100%",
            maxHeight: "400px",
            objectFit: "contain",
            borderRadius: "10px",
            transform: "scaleX(-1)",
          }}
        />

        {/* Flash effect */}
        {flashActive && <div className="camera-flash" />}

        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Captured preview */}
        {capturedImage && (
          <div className="preview-container">
            <img
              id="captured-preview"
              src={capturedImage.url}
              alt="Captured frame"
              onLoad={() => {
                /* re-draw boxes if result already exists */
              }}
            />
            <canvas ref={overlayCanvasRef} />
          </div>
        )}

        {/* Scanning overlay on live feed */}
        {cameraActive && (
          <div className="camera-scan-overlay">
            <div className="scan-corner scan-tl" />
            <div className="scan-corner scan-tr" />
            <div className="scan-corner scan-bl" />
            <div className="scan-corner scan-br" />
            <div className="scan-line" />
          </div>
        )}
      </div>

      {/* ── Action Buttons ────────────────────────────── */}
      <div className="camera-actions">
        {cameraActive && (
          <>
            <button className="run-btn capture-btn" onClick={captureFrame}>
              ⏺ CAPTURE FRAME
            </button>
            <button
              className="camera-secondary-btn"
              onClick={stopCamera}
            >
              ✕ CLOSE CAMERA
            </button>
          </>
        )}

        {capturedImage && (
          <>
            <button
              className="run-btn"
              onClick={runAnalysis}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" /> ANALYZING...
                </>
              ) : (
                <>▶ RUN ANALYSIS</>
              )}
            </button>
            <button className="camera-secondary-btn" onClick={retake}>
              ↻ RETAKE
            </button>
          </>
        )}
      </div>
    </div>
  );
}
