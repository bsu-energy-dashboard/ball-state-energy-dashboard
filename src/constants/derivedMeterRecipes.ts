export const KNOWN_DERIVED_METER_RECIPES: Record<string, string[]> = {
  totalfoundation: [
    "FOUNDATIONAL+SCIENCE-FBPM7-APT",
    "FOUNDATIONAL+SCIENCE-FBPM17-APT",
  ],
  totalenergy: [
    "CHRISTY+WOODS-CWPM47-kWTot",
    "CHRISTY+WOODS-CWPM117-kWTot",
    "CHRISTY+WOODS-CWPM97-kWTot",
    "BETHEL+SUB-BSPM177-AI-111018",
    "BETHEL+SUB-BSPM187-AI-111018",
  ],
};

export function recipeAvailable(
  recipe: string[],
  availableMeters: readonly string[],
): boolean {
  const available = new Set(availableMeters);
  return recipe.length > 0 && recipe.every((meter) => available.has(meter));
}

export function campusTotalPreset(availableMeters: readonly string[]): string[] {
  const teamRecipe = [
    "BETHEL SUB.BSPM177.APT", "BETHEL SUB.BSPM187.APT",
    "CHRISTY WOODS.CWPM47.APT", "CHRISTY WOODS.CWPM97.APT",
    "CHRISTY WOODS.CWPM117.APT",
  ];
  return [teamRecipe, KNOWN_DERIVED_METER_RECIPES.totalenergy]
    .find((recipe) => recipeAvailable(recipe, availableMeters)) ?? [];
}
