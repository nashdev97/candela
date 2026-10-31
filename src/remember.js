import { validateAgainstSource } from "./guard.js";
import { chatJson, ollamaConfig } from "./ollama.js";
import { parseModelJson, sourceBag } from "./parse.js";
import { systemPrompt, userPrompt } from "./prompt.js";

export async function lightCandela(input, deps = {}) {
  const bag = sourceBag(input);
  const config = deps.config || ollamaConfig();
  const chat = deps.chatJson || chatJson;
  const system = systemPrompt();
  let retries = 0;

  let raw = await chat({
    ...config,
    system,
    user: userPrompt(bag),
  });
  let draft = groundDraft(bag, parseModelJson(raw));
  let check = validateAgainstSource(bag, draft);

  if (!check.ok) {
    retries = 1;
    raw = await chat({
      ...config,
      system,
      user: userPrompt(bag, check.problems.join(" ")),
    });
    draft = groundDraft(bag, parseModelJson(raw));
    check = validateAgainstSource(bag, draft);
  }

  if (!check.ok) {
    throw new Error(`Candela refused to invent. ${check.problems[0]}`);
  }

  return {
    person: {
      name: bag.name,
      relationship: bag.relationship,
      years: bag.years,
      foods: bag.foods,
      songs: bag.songs,
      stories: bag.stories,
    },
    ofrenda: draft,
    model: config.model,
    retries,
    grounded: true,
  };
}

function groundDraft(bag, draft) {
  const firstName = bag.name.split(/\s+/)[0];
  let remembrance = draft.remembrance;
  let title = draft.title;
  if (firstName && !remembrance.toLowerCase().includes(firstName.toLowerCase())) {
    remembrance = `${bag.name}. ${remembrance}`.trim();
  }
  if (!title) title = `For ${bag.name}`;
  else if (firstName && !title.toLowerCase().includes(firstName.toLowerCase())) {
    title = `${title} — ${bag.name}`;
  }
  return { ...draft, title, remembrance };
}
