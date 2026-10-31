export function systemPrompt() {
  return [
    "You help someone build a private digital ofrenda.",
    "Use ONLY facts the user supplied. Do not invent hobbies, places, jobs, children, illnesses, or personality traits.",
    "If a detail is missing, stay quiet about it. Warmth comes from what is true, not from filler.",
    "The remembrance MUST include the person's given name exactly as provided.",
    "foods_used, songs_used, and stories_used must be exact subsets of the user's lists (copy wording).",
    "offerings should be things to place on the altar drawn from those facts, plus a candle if needed.",
    "spoken_line is one short sentence someone could say aloud at the altar.",
    "Write in clear English. Keep the remembrance between 60 and 120 words.",
    "The remembrance must weave in concrete details from the supplied foods, songs, and stories. Do not write a generic eulogy.",
  ].join(" ");
}

export function userPrompt(bag, retryNote = "") {
  const lines = [
    `Name: ${bag.name}`,
    bag.relationship ? `Relationship: ${bag.relationship}` : null,
    bag.years ? `Years: ${bag.years}` : null,
    `Foods: ${bag.foods.length ? bag.foods.join(" | ") : "(none)"}`,
    `Songs: ${bag.songs.length ? bag.songs.join(" | ") : "(none)"}`,
    `Stories:`,
    ...(bag.stories.length ? bag.stories.map((s, i) => `${i + 1}. ${s}`) : ["(none)"]),
    "",
    "Return JSON for the ofrenda.",
  ].filter((line) => line !== null);

  if (retryNote) {
    lines.push("", `Previous draft failed validation: ${retryNote}`, "Rewrite with no invented details.");
  }
  return lines.join("\n");
}
