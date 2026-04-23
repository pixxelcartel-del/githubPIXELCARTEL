import { demoPaper } from "@/lib/paper-data";

export function DiagramRenderer({ questionId }: { questionId: string }) {
  const question = demoPaper.questions.find((item) => item.id === questionId);
  const title = question?.title ?? "";

  if (questionId === "q1") {
    return <MomentumGraph />;
  }
  if (questionId === "q4") {
    return <LensDiagram />;
  }
  if (questionId === "q6") {
    return <CircuitDiagram />;
  }
  if (questionId === "q7") {
    return <ElectrostaticDiagram />;
  }
  if (questionId === "q8") {
    return <RutherfordDiagram />;
  }
  if (questionId === "q9") {
    return <OrbitDiagram />;
  }
  if (questionId === "q5") {
    return <ConvectionDiagram />;
  }

  return <ThermalDiagram title={title} />;
}

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#14c7eb]/20 bg-white/35 p-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.55)]">
      <p className="mb-2 text-xs font-bold uppercase tracking-normal text-[#596373]">{title}</p>
      <svg viewBox="0 0 360 190" className="h-44 w-full" role="img" aria-label={title}>
        {children}
      </svg>
    </div>
  );
}

function MomentumGraph() {
  return (
    <Frame title="Editable momentum-time sketch">
      <rect x="28" y="20" width="300" height="132" rx="8" fill="rgba(255,255,255,.55)" />
      <path d="M52 132H304M52 132V38" stroke="#242b38" strokeWidth="2" />
      <path d="M52 132 L112 86 L196 62 L282 44" fill="none" stroke="#14c7eb" strokeWidth="5" strokeLinecap="round" />
      <circle cx="112" cy="86" r="5" fill="#1ac780" />
      <circle cx="196" cy="62" r="5" fill="#1ac780" />
      <text x="44" y="160" fill="#596373" fontSize="12">time / s</text>
      <text x="16" y="38" fill="#596373" fontSize="12" transform="rotate(-90 16 38)">momentum</text>
      <text x="96" y="112" fill="#090c12" fontSize="12">gradient = force</text>
    </Frame>
  );
}

function LensDiagram() {
  return (
    <Frame title="Editable lens ray sketch">
      <line x1="30" y1="95" x2="330" y2="95" stroke="#596373" strokeWidth="2" />
      <ellipse cx="180" cy="95" rx="18" ry="72" fill="rgba(20,199,235,.14)" stroke="#14c7eb" strokeWidth="3" />
      <line x1="100" y1="130" x2="100" y2="62" stroke="#090c12" strokeWidth="4" />
      <polygon points="100,54 92,66 108,66" fill="#090c12" />
      <path d="M100 60 L180 60 L282 95" fill="none" stroke="#f2406e" strokeWidth="3" />
      <path d="M100 60 L180 95 L282 132" fill="none" stroke="#1ac780" strokeWidth="3" />
      <path d="M180 60 L92 30M180 95 L72 38" stroke="#d6a347" strokeDasharray="5 5" strokeWidth="2" />
      <text x="50" y="154" fill="#596373" fontSize="12">trace rays back for virtual image</text>
    </Frame>
  );
}

function CircuitDiagram() {
  return (
    <Frame title="Editable circuit/resistance sketch">
      <path d="M62 54H300V140H62Z" fill="none" stroke="#242b38" strokeWidth="4" />
      <line x1="92" y1="42" x2="92" y2="68" stroke="#242b38" strokeWidth="3" />
      <line x1="104" y1="48" x2="104" y2="62" stroke="#242b38" strokeWidth="3" />
      <rect x="145" y="43" width="72" height="24" rx="6" fill="rgba(20,199,235,.22)" stroke="#14c7eb" />
      <rect x="238" y="128" width="46" height="24" rx="6" fill="rgba(26,199,128,.22)" stroke="#1ac780" />
      <circle cx="62" cy="98" r="20" fill="white" stroke="#d6a347" strokeWidth="3" />
      <text x="55" y="103" fill="#090c12" fontSize="13">A</text>
      <text x="158" y="60" fill="#090c12" fontSize="12">P</text>
      <text x="220" y="92" fill="#596373" fontSize="12">series current same</text>
    </Frame>
  );
}

function ElectrostaticDiagram() {
  return (
    <Frame title="Editable induced-charge sketch">
      <rect x="42" y="74" width="92" height="28" rx="14" fill="rgba(242,64,110,.2)" stroke="#f2406e" strokeWidth="3" />
      <circle cx="236" cy="88" r="46" fill="rgba(214,163,71,.14)" stroke="#d6a347" strokeWidth="3" />
      {["-", "-", "-", "-"].map((label, index) => (
        <text key={index} x={70 + index * 15} y="93" fill="#f2406e" fontSize="20">{label}</text>
      ))}
      <text x="202" y="90" fill="#1ac780" fontSize="18">+</text>
      <text x="250" y="90" fill="#14c7eb" fontSize="18">-</text>
      <path d="M204 128 C160 142 120 128 92 108" fill="none" stroke="#1ac780" strokeDasharray="4 5" />
      <text x="52" y="154" fill="#596373" fontSize="12">electrons move; protons stay fixed</text>
    </Frame>
  );
}

function RutherfordDiagram() {
  return (
    <Frame title="Editable Rutherford evidence sketch">
      <rect x="150" y="38" width="64" height="116" rx="6" fill="rgba(214,163,71,.18)" stroke="#d6a347" />
      <circle cx="182" cy="96" r="10" fill="#f2406e" />
      <path d="M38 58 C96 58 124 64 162 84" stroke="#14c7eb" strokeWidth="3" fill="none" />
      <path d="M38 94 H312" stroke="#1ac780" strokeWidth="3" fill="none" />
      <path d="M38 130 C114 130 154 132 226 50" stroke="#f2406e" strokeWidth="3" fill="none" />
      <text x="52" y="168" fill="#596373" fontSize="12">most pass straight; rare deflections reveal nucleus</text>
    </Frame>
  );
}

function OrbitDiagram() {
  return (
    <Frame title="Editable orbital motion sketch">
      <circle cx="180" cy="95" r="22" fill="rgba(214,163,71,.9)" />
      <circle cx="180" cy="95" r="74" fill="none" stroke="#14c7eb" strokeWidth="3" strokeDasharray="7 6" />
      <circle cx="252" cy="78" r="10" fill="#1ac780" />
      <path d="M252 78 L220 92" stroke="#f2406e" strokeWidth="3" markerEnd="url(#arrow)" />
      <path d="M252 78 L276 54" stroke="#090c12" strokeWidth="3" markerEnd="url(#arrow)" />
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#090c12" />
        </marker>
      </defs>
      <text x="62" y="164" fill="#596373" fontSize="12">gravity changes direction of velocity</text>
    </Frame>
  );
}

function ConvectionDiagram() {
  return (
    <Frame title="Editable convection loop sketch">
      <rect x="86" y="34" width="180" height="110" rx="14" fill="rgba(20,199,235,.10)" stroke="#14c7eb" />
      <path d="M130 120 C92 72 142 54 176 76 C220 104 250 72 220 48" fill="none" stroke="#1ac780" strokeWidth="4" />
      <path d="M226 50 l-16 2 l10 13" fill="none" stroke="#1ac780" strokeWidth="4" />
      <ellipse cx="176" cy="150" rx="72" ry="12" fill="rgba(242,64,110,.24)" />
      <text x="90" y="170" fill="#596373" fontSize="12">heated liquid expands, becomes less dense, rises</text>
    </Frame>
  );
}

function ThermalDiagram({ title }: { title: string }) {
  return (
    <Frame title="Editable thermal-particle sketch">
      <line x1="62" y1="104" x2="294" y2="104" stroke="#242b38" strokeWidth="6" strokeLinecap="round" />
      <circle cx="82" cy="104" r="22" fill="rgba(242,64,110,.22)" stroke="#f2406e" />
      {[122, 158, 194, 230].map((x) => (
        <path key={x} d={`M${x} 82 q18 12 0 24`} fill="none" stroke="#14c7eb" strokeWidth="3" />
      ))}
      <text x="64" y="154" fill="#596373" fontSize="12">{title || "particle transfer"}: cause before effect</text>
    </Frame>
  );
}
