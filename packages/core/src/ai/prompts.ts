export interface ChipsContext {
  hasCompare: boolean;
  hasFocusModel: boolean;
  focusModelTitle?: string | null;
}

export function suggestedPrompts(ctx: ChipsContext): string[] {
  if (ctx.hasFocusModel) {
    const t = ctx.focusModelTitle?.trim() ? `"${ctx.focusModelTitle}"` : "this model";
    return [
      `How is ${t} performing?`,
      `What's driving the conversion rate of ${t}?`,
      `How does ${t} compare to my catalogue average?`,
      `Is ${t} still gaining traction or fading?`,
      ...(ctx.hasCompare
        ? [`How did ${t} do vs the comparison period?`]
        : []),
      `Suggest improvements for cover, title, or tags of ${t}.`,
    ];
  }
  return [
    "What's my best-performing model right now?",
    "Which category should I invest in most?",
    "Why is my view → download conversion low?",
    "Summarize my last period in 3 bullets",
    "Which traffic source is underperforming?",
    "What should I publish next based on this data?",
    ...(ctx.hasCompare
      ? [
          "Did this period beat the comparison one?",
          "What's my biggest gainer and biggest loser?",
        ]
      : []),
  ];
}
