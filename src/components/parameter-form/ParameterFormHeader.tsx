import { SlidersHorizontal } from "lucide-react";

export function ParameterFormHeader() {
  return (
    <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-5 dark:border-gray-700 sm:px-6">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0079A7]/10 text-[#0079A7] dark:text-[#AEDBE9]"><SlidersHorizontal size={20} aria-hidden="true" /></span>
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Set up your analysis</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Choose a time range and meter, then refine the settings you need.</p>
      </div>
    </div>
  );
}
