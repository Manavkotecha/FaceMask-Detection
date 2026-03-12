export default function OrbitalSphere() {
  return (
    <div className="sphere-container">
      <div className="orbital-ring orbital-ring-1" />
      <div className="orbital-ring orbital-ring-2" />
      <div className="wireframe-sphere">
        <svg viewBox="0 0 100 100" fill="none" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
          {/* Geodesic sphere lines (simplified globe illusion) */}
          <circle cx="50" cy="50" r="48" stroke="#38bdf8" opacity="0.3" strokeWidth="1.5" />
          
          <ellipse cx="50" cy="50" rx="18" ry="48" stroke="#38bdf8" />
          <ellipse cx="50" cy="50" rx="35" ry="48" stroke="#38bdf8" opacity="0.7"/>
          <ellipse cx="50" cy="50" rx="48" ry="18" stroke="#38bdf8" />
          <ellipse cx="50" cy="50" rx="48" ry="35" stroke="#38bdf8" opacity="0.7"/>
          
          <ellipse cx="50" cy="50" rx="48" ry="12" stroke="#818cf8" transform="rotate(45 50 50)" />
          <ellipse cx="50" cy="50" rx="48" ry="12" stroke="#818cf8" transform="rotate(-45 50 50)" />
          
          {/* Crossing lines */}
          <path d="M2.5 50 L97.5 50 M50 2.5 L50 97.5 M15 15 L85 85 M15 85 L85 15" stroke="#38bdf8" opacity="0.5" />
        </svg>
      </div>
    </div>
  );
}
