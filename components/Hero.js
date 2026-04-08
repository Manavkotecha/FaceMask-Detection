"use client";

import { useEffect, useRef } from "react";
import OrbitalSphere from "./OrbitalSphere";

export default function Hero() {
  const canvasRef = useRef(null);

  /* ── Subtle particle background animation ────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let time = 0;

    function resize() {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    }

    // Draw little floating glowing dots to mimic space/particles
    const particles = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * 2000,
      y: Math.random() * 2000,
      baseSize: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.2 + 0.05,
      offset: Math.random() * 100
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.02;

      for (const p of particles) {
        p.y -= p.speed;
        if (p.y < -10) p.y = canvas.height + 10;

        const alpha = Math.abs(Math.sin(time + p.offset)) * 0.5 + 0.1;
        ctx.fillStyle = `rgba(148, 163, 184, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x % canvas.width, p.y, p.baseSize, 0, Math.PI * 2);
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section className="hero">
      <canvas ref={canvasRef} className="starfield-canvas" />

      {/* ── Background Sphere & Rings ───────────────────── */}
      <OrbitalSphere />

      <div className="section-pad hero-inner">
        {/* ── Left Column: Typography ─────────────────────── */}
        <div style={{ paddingRight: "1rem", position: "relative", zIndex: 10 }}>
          <h1 className="hero-title">
            <span className="title-outline">Next-</span><br />
            <span className="title-solid">Gen</span><br />
            <span className="title-cyan">Face</span><br />
            <span className="title-purple">Protection</span><br />
            <span className="title-solid">Analysis</span>
          </h1>

          <p className="hero-description">
            Ensure safety and compliance instantly. Our advanced neural network accurately identifies faces and evaluates mask-wearing correctly in milliseconds.
          </p>

          <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="run-btn" style={{ width: 'auto', padding: '14px 32px', margin: 0, background: 'linear-gradient(135deg, var(--cyan), var(--purple))' }} onClick={() => document.getElementById('detector').scrollIntoView()}>
              Init Scanner ⬇
            </button>
          </div>
        </div>

        {/* ── Right Column: Visual Feed ───────────────────── */}
        <div className="hero-visual" style={{ position: "relative", zIndex: 10, transform: "translate(7rem, -10rem)" }}>
          <div className="hero-image-container glass">
            {/* Stylized technology/people placeholder image from Unsplash */}
            <img
              src="https://images.unsplash.com/photo-1544256718-3bcf237f3974?auto=format&fit=crop&q=80&w=800"
              alt="Live Face Scanning Feed"
              style={{ filter: "brightness(0.85) contrast(1.1)" }}
            />

            {/* Cyberpunk Scanner Overlays */}
            <div style={{ position: 'absolute', top: '10%', left: '10%', padding: '8px', border: '1px solid rgba(56, 189, 248, 0.5)', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(5px)' }}>
              <div style={{ color: 'var(--cyan)', fontSize: '0.5rem', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>
                SCANNING...<br />RECOGNITION INITIATED<br />FACIAL STRUCTURE ANALYZED
              </div>
            </div>

            <div style={{ position: 'absolute', bottom: '25%', right: '10%', padding: '8px', border: '1px solid rgba(129, 140, 248, 0.5)', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(5px)' }}>
              <div style={{ color: 'var(--purple)', fontSize: '0.5rem', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>
                SCANNING...<br />TARGET LOCKED
              </div>
            </div>

            {/* Bottom-left precision stat perfectly matching the screenshot */}
            <div className="stat-badge">
              <div className="stat-icon">$</div>
              <div className="stat-info">
                <span className="stat-label">Precision</span>
                <span className="stat-value">96.33%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
