const STOP = new Set(
  `a an and are as at be but by for from had has have he her hers him his i if in into is it its me my of on or our she so that the their them they this to was we were with you your about after again also always around because been before being between both came come could did does doing during each even every few first get got had has have here how just know like little long made make many more most much must never only other over own same say said should since some still such than then there these those through under until very want was were what when where which while who why will with would year years`.split(
    /\s+/
  )
);

export function splitList(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(/\n|,|;|\u2022|\u00b7/)
    .map((part) => part.replace(/^[\s\-–—*]+/, "").trim())
    .filter(Boolean);
}

export function normalizeName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

export function sourceBag(input) {
  const name = normalizeName(input.name);
  const relationship = normalizeName(input.relationship);
  const foods = unique(splitList(input.foods));
  const songs = unique(splitList(input.songs));
  const stories = unique(splitList(input.stories));
  const years = normalizeName(input.years);

  if (!name) throw new Error("Name the person this ofrenda is for.");
  if (name.length > 80) throw new Error("Keep the name under 80 characters.");
  if (relationship.length > 80) throw new Error("Keep the relationship under 80 characters.");
  if (years.length > 40) throw new Error("Keep the years under 40 characters.");
  if (foods.length + songs.length + stories.length < 2) {
    throw new Error("Bring at least two facts: foods, songs, or short stories.");
  }
  if (foods.length > 12 || songs.length > 12 || stories.length > 12) {
    throw new Error("Keep each list to 12 items or fewer.");
  }
  for (const story of stories) {
    if (story.length > 280) throw new Error("Keep each story under 280 characters.");
  }

  const blob = [name, relationship, years, ...foods, ...songs, ...stories].join("\n");
  return { name, relationship, years, foods, songs, stories, blob };
}

export function tokens(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^'+|'+$/g, ""))
    .filter((t) => t.length >= 4 && !STOP.has(t));
}

export function sourceTokenSet(bag) {
  return new Set(tokens(bag.blob));
}

export function unique(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function parseModelJson(raw) {
  let data;
  try {
    data = JSON.parse(extractJson(raw));
  } catch {
    throw new Error("Model returned invalid JSON.");
  }
  if (!data || typeof data !== "object") throw new Error("Model returned empty JSON.");
  return {
    title: String(data.title || "").trim(),
    remembrance: String(data.remembrance || "").trim(),
    foods_used: asStringList(data.foods_used),
    songs_used: asStringList(data.songs_used),
    stories_used: asStringList(data.stories_used),
    offerings: Array.isArray(data.offerings)
      ? data.offerings
          .slice(0, 6)
          .map((item) => ({
            label: String(item?.label || "").trim(),
            kind: ["food", "song", "story", "candle", "photo"].includes(item?.kind)
              ? item.kind
              : "candle",
          }))
          .filter((item) => item.label)
      : [],
    spoken_line: String(data.spoken_line || "").trim(),
  };
}

function asStringList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function extractJson(raw) {
  const text = String(raw || "").trim();
  if (text.startsWith("{")) return text;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text;
}
