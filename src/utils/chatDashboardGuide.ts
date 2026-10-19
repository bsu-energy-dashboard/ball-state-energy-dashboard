const OVERAGE_GUIDE = `To find overage hours:

1. Open the **Threshold Detection** tab.
2. Set **Date Range** to dates covered by your dataset, including the final hour you want to analyze.
3. Choose **Main Meter**. For a campus total, create a group under **Meter Groups** using Bethel 177 and 187 plus Christy Woods 47, 97 and 117, then select that group. Use the column names in your current dataset.
4. Set **Threshold Mode** to **Fixed** and enter your agreed threshold. Check that its units match the dataset; hourly kWh and kW should not be treated as interchangeable without checking the interval.
5. Review **RPCA Meters**, the cleaning settings, and any date windows under **Advanced Options**, then click **Generate Analysis**.
6. Read **Overage events** for event periods and **Event contributions** for estimated meter contributions. Contributions help you investigate; they do not prove a cause.

A missing campus component must leave the total missing, not zero. Missing data does not mean there were no overages.

These are instructions only. I have not changed your fields or run an analysis.`;

/** Handle navigation help before the form-command parser or data chatbot. */
export function getDashboardGuide(text: string): string | null {
  const question = text.trim();
  const asksForHelp = /^(?:how\s+(?:do|can|should|would)\s+i\b|where\s+(?:do|can|should)\s+i\b|help\s+me\b|(?:please\s+)?(?:show|tell)\s+me\s+how\b|walk\s+me\s+through\b)/i.test(question);
  const asksForOverage = /\boverages?\b|\bthreshold\s+detection\b|\bexceed(?:ing|ance|ances)?\b/i.test(question);
  if (!asksForHelp || !asksForOverage) return null;
  return OVERAGE_GUIDE;
}
