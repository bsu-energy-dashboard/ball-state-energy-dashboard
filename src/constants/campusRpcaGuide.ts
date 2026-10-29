/** Shared with the chatbot preset so its guide stays aligned with the request. */
export const CAMPUS_RPCA_DEMO = {
  startDate: "2024-04-01T00:00",
  endDate: "2025-07-28T23:59",
  cleaningMethod: "Polynomial",
  cleaningWindow: 12,
  cleaningNSigma: 3.3,
  threshold: 22000,
} as const;

export const CAMPUS_RPCA_OUTPUTS = [
  ["Energy Deviation Events", "A color chart showing which meters used more or less energy than the estimated usual pattern."],
  ["Actual vs LMatrix", "A line chart comparing the selected meter’s actual energy use with its estimated usual use."],
  ["Campus Total vs Threshold", "A chart showing total campus energy use and the limit you chose. Overage Hours tells you how many hours with complete data were above that limit."],
] as const;

export const CAMPUS_RPCA_TERMS = "L means the estimated usual energy-use pattern. S means the difference from that pattern; an unusual reading does not always mean something is wrong.";

function readableDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

export const CAMPUS_RPCA_GUIDE = `**What does this setup do?**

It helps you see usual energy use, unusual changes, and times when campus energy use went above a limit.

**Settings for this demo**
- **Dates:** ${readableDate(CAMPUS_RPCA_DEMO.startDate)} through ${readableDate(CAMPUS_RPCA_DEMO.endDate)}, including the last day.
- **Energy limit:** ${CAMPUS_RPCA_DEMO.threshold.toLocaleString("en-US")} kW. The results will count hours above this limit.
- **Data cleaning:** ${CAMPUS_RPCA_DEMO.cleaningMethod} cleaning helps reduce unusual spikes before analysis. The demo uses a window of ${CAMPUS_RPCA_DEMO.cleaningWindow} and a sensitivity setting of ${CAMPUS_RPCA_DEMO.cleaningNSigma}; you can leave these as they are.
- **Meters:** The campus total normally combines five meters: Bethel BSPM177 and BSPM187, plus Christy Woods CWPM47, CWPM97, and CWPM117. These are selected when all five are available. Check the meter choices in the panel; this demo keeps any choices you already made.

**What will be generated?**
${CAMPUS_RPCA_OUTPUTS.map(([title, description]) => `- **${title}:** ${description}`).join("\n")}

${CAMPUS_RPCA_TERMS}

**How to get your results**
1. Ask me to “Set up Campus RPCA for the demo.”
2. Click **Apply settings** on the settings card.
3. Check the dates and meters in the **Campus overview** panel.
4. Click **Generate** in that panel to run the analysis and see your results.

Applying settings only fills in the form. **You must click Generate to get results.** A long date range can take several minutes.`;
