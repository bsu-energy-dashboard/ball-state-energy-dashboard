import { useId, useState, type ReactNode } from "react";

export default function PlotViewTabs({ image, title, children }: { image?: string; title: string; children?: ReactNode }) {
  const [view, setView] = useState<"interactive" | "image">("interactive");
  const id = useId();
  const active = children ? (image ? view : "interactive") : "image";
  return <section className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
    <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
    <div role="tablist" aria-label={`${title} display`} className="mb-4 flex gap-2">
      {(["interactive", "image"] as const).map((mode, index) => <button key={mode} type="button" role="tab"
        id={`${id}-${mode}`} aria-controls={`${id}-panel`} aria-selected={active === mode}
        disabled={mode === "interactive" ? !children : !image} tabIndex={active === mode ? 0 : -1}
        onClick={() => setView(mode)} onKeyDown={(event) => {
          if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) && children && image) {
            event.preventDefault(); const next = event.key === "Home" ? "interactive" : event.key === "End" ? "image" : index === 0 ? "image" : "interactive";
            setView(next); document.getElementById(`${id}-${next}`)?.focus();
          }
        }} className={`rounded-md px-4 py-2 text-sm disabled:opacity-40 ${active === mode ? "bg-[#ba0c2f] text-white" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"}`}>
        {mode === "interactive" ? "Interactive" : "Image"}
      </button>)}
    </div>
    <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${active}`}>
      {active === "interactive" ? children : image ? <img src={`data:image/png;base64,${image}`} alt={title} className="w-full rounded-lg" /> : <p>No chart available.</p>}
    </div>
    {!children && <p className="mt-2 text-sm text-gray-500">Interactive data is not available in this result. Generate a new result after updating the API.</p>}
  </section>;
}
