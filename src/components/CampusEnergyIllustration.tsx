/** Decorative campus power diagram; does not represent live measurements. */
export default function CampusEnergyIllustration() {
  return (
    <svg viewBox="0 0 400 160" fill="none" aria-hidden="true" className="h-36 w-full max-w-sm text-[#0079A7] dark:text-[#AEDBE9]">
      <path d="M18 134H382M50 134V72h64v62M130 134V46h88v88M238 134V84h56v50M310 134V62h50v72" stroke="currentColor" strokeWidth="1.5" opacity=".5" />
      <path d="M126 46l48-26 48 26M163 134v-28h22v28" stroke="currentColor" strokeWidth="1.5" />
      {[64, 87, 145, 169, 193, 251, 274, 324, 346].map((x) => (
        <g key={x} fill="currentColor" opacity=".2"><rect x={x} y={x > 235 && x < 300 ? 94 : 78} width="7" height="10" rx="1" /><rect x={x} y="111" width="7" height="10" rx="1" /></g>
      ))}
      <path d="M20 148h76V98h45V65h66v83h65v-42h109" stroke="currentColor" strokeWidth="2" opacity=".18" />
      <path className="energy-flow" d="M20 148h76V98h45V65h66v83h65v-42h109" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="12 38" />
      <circle cx="335" cy="34" r="20" fill="currentColor" opacity=".08" />
      <path d="M338 20l-12 16h9l-3 12 13-17h-10l3-11Z" fill="currentColor" />
      <path d="M18 50h28m-20-8h18M254 42h35m-25-8h17" stroke="currentColor" strokeLinecap="round" opacity=".25" />
    </svg>
  );
}
