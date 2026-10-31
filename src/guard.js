export function validateAgainstSource(bag, draft) {
  const problems = [];

  if (!draft.title) problems.push("Missing title.");
  if (!draft.remembrance || draft.remembrance.length < 120) {
    problems.push("Remembrance is too short.");
  }
  if (draft.remembrance.length > 900) problems.push("Remembrance is too long.");
  if (!draft.spoken_line) problems.push("Missing spoken line.");
  if (draft.spoken_line.length > 220) problems.push("Spoken line is too long.");
  if (!draft.offerings.length) problems.push("No offerings returned.");

  const firstName = bag.name.toLowerCase().split(/\s+/)[0];
  if (!draft.remembrance.toLowerCase().includes(firstName)) {
    problems.push("Remembrance never says their name.");
  }
  if (!proseTouchesFacts(bag, draft.remembrance)) {
    problems.push("Remembrance never uses a concrete food, song, or story detail.");
  }

  problems.push(...subsetProblems("food", bag.foods, draft.foods_used));
  problems.push(...subsetProblems("song", bag.songs, draft.songs_used));
  problems.push(...subsetProblems("story", bag.stories, draft.stories_used));
  problems.push(...offeringProblems(bag, draft.offerings));

  const invented = inventedClaims(bag, draft);

  return {
    ok: problems.length === 0,
    problems,
    invented,
  };
}

export function inventedClaims(bag, draft) {
  const invented = [];
  for (const item of draft.foods_used) {
    if (!bag.foods.some((food) => food.toLowerCase() === item.toLowerCase())) {
      invented.push(item);
    }
  }
  for (const item of draft.songs_used) {
    if (!bag.songs.some((song) => song.toLowerCase() === item.toLowerCase())) {
      invented.push(item);
    }
  }
  for (const item of draft.stories_used) {
    if (!bag.stories.some((story) => story.toLowerCase() === item.toLowerCase())) {
      invented.push(item);
    }
  }
  return invented;
}

export function inventedContent(bag, draft) {
  return inventedClaims(bag, draft);
}

function proseTouchesFacts(bag, remembrance) {
  const text = remembrance.toLowerCase();
  const facts = [...bag.foods, ...bag.songs, ...bag.stories];
  return facts.some((fact) => {
    const words = fact
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length >= 4);
    if (!words.length) return false;
    const hits = words.filter((w) => text.includes(w)).length;
    return hits >= Math.min(2, words.length) || text.includes(fact.toLowerCase());
  });
}

function offeringProblems(bag, offerings) {
  const problems = [];
  const blob = bag.blob.toLowerCase();
  for (const offering of offerings) {
    if (offering.kind === "candle" || offering.kind === "photo") continue;
    if (/candle|marigold|cempasuchil|water|photo|portrait/i.test(offering.label)) continue;
    const label = offering.label.toLowerCase();
    const listed =
      fuzzyIn(bag.foods, offering.label) ||
      fuzzyIn(bag.songs, offering.label) ||
      fuzzyIn(bag.stories, offering.label) ||
      blob.includes(label) ||
      label.split(/\s+/).filter((w) => w.length >= 4).some((w) => blob.includes(w));
    if (!listed) {
      problems.push(`offering not grounded in your notes: ${offering.label}`);
    }
  }
  return problems;
}

function fuzzyIn(list, label) {
  const needle = label.toLowerCase();
  return list.some((item) => {
    const hay = item.toLowerCase();
    return hay === needle || hay.includes(needle) || needle.includes(hay);
  });
}

function subsetProblems(kind, allowed, used) {
  const problems = [];
  for (const item of used) {
    if (!fuzzyIn(allowed, item)) {
      problems.push(`${kind} not in your list: ${item}`);
    }
  }
  return problems;
}
