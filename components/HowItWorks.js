export default function HowItWorks() {
  const steps = [
    {
      icon: "🔍",
      iconClass: "pipeline-icon-1",
      title: "1. Feature Extraction",
      desc: "A Deep Convolutional Network processes the image, extracting low-level edges and high-level semantic features simultaneously.",
    },
    {
      icon: "📐",
      iconClass: "pipeline-icon-2",
      title: "2. Region Proposals",
      desc: 'The Region Proposal Network (RPN) slides over the image generating potential bounding boxes where human faces might be located.',
    },
    {
      icon: "✅",
      iconClass: "pipeline-icon-3",
      title: "3. Classification",
      desc: 'ROI Pooling scales the proposals, which are fed into fully connected layers to predict: "With Mask", "Without Mask", or "Incorrect".',
    },
  ];

  return (
    <section className="how-it-works" id="how-it-works">
      <div style={{ position: "relative", zIndex: 1 }}>
        <h2 className="section-heading">How The Neural Network Predicts</h2>
        <p className="section-subtext">
          Our cutting-edge Faster R-CNN model breaks down images in real-time to
          analyze structural features, detecting human faces and classifying mask
          compliance with outstanding accuracy.
        </p>

        <div className="pipeline-cards">
          {steps.map((s, i) => (
            <div key={i} className="pipeline-card glass glow-border">
              <div className={`pipeline-icon ${s.iconClass}`}>{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative particles */}
      <div className="particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${100 + Math.random() * 20}%`,
              animationDuration: `${6 + Math.random() * 10}s`,
              animationDelay: `${Math.random() * 8}s`,
            }}
          />
        ))}
      </div>
    </section>
  );
}
