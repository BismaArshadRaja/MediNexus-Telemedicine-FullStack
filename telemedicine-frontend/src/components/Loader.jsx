import { Stethoscope } from "lucide-react";

// Shared loading indicator used across the app whenever we're waiting on the
// backend (fetching data, calling the AI, uploading a file, etc).
export default function Loader({ label = "Loading...", size = "md", className = "" }) {
  const sizes = {
    sm: { icon: "h-5 w-5", text: "text-xs" },
    md: { icon: "h-7 w-7", text: "text-sm" },
    lg: { icon: "h-10 w-10", text: "text-base" },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex flex-col items-center justify-center gap-2 py-8 text-slate-500 ${className}`}>
      <Stethoscope className={`${s.icon} text-teal-600 animate-pulse`} style={{ animation: "medinexus-spin 1.4s ease-in-out infinite" }} />
      <p className={`${s.text} font-medium`}>{label}</p>
      <style>{`
        @keyframes medinexus-spin {
          0%, 100% { transform: rotate(-8deg) scale(1); }
          50% { transform: rotate(8deg) scale(1.08); }
        }
      `}</style>
    </div>
  );
}

// Small inline variant for buttons ("Sending...", "Analyzing...", etc.)
export function InlineLoader({ className = "" }) {
  return (
    <Stethoscope
      className={`h-4 w-4 inline-block text-current ${className}`}
      style={{ animation: "medinexus-spin 1s ease-in-out infinite" }}
    />
  );
}
