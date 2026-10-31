import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inventedContent, validateAgainstSource } from "../src/guard.js";
import { parseModelJson, sourceBag, splitList } from "../src/parse.js";
import { lightCandela } from "../src/remember.js";

describe("sourceBag", () => {
  it("requires a name and at least two facts", () => {
    assert.throws(() => sourceBag({ name: "", foods: "pan", songs: "", stories: "" }), /Name/);
    assert.throws(
      () => sourceBag({ name: "Rosa", foods: "pan", songs: "", stories: "" }),
      /two facts/
    );
  });

  it("splits lists on commas and newlines", () => {
    assert.deepEqual(splitList("pan, mole\ncafe"), ["pan", "mole", "cafe"]);
  });
});

describe("guard", () => {
  const bag = sourceBag({
    name: "Rosa Elena Vargas",
    relationship: "Abuela",
    years: "1938–2021",
    foods: "pan de muerto, cafe de olla",
    songs: "Cielito Lindo",
    stories: "She tapped cinnamon twice before coffee.",
  });

  it("accepts a grounded draft", () => {
    const draft = {
      title: "For Rosa",
      remembrance:
        "Rosa Elena Vargas kept coffee close. The ofrenda holds pan de muerto and cafe de olla while Cielito Lindo stays near the candle. She tapped cinnamon twice before coffee, and that small habit is enough light for tonight.",
      foods_used: ["pan de muerto", "cafe de olla"],
      songs_used: ["Cielito Lindo"],
      stories_used: ["She tapped cinnamon twice before coffee."],
      offerings: [
        { label: "pan de muerto", kind: "food" },
        { label: "candle", kind: "candle" },
      ],
      spoken_line: "Rosa, the cinnamon tin still remembers your hands.",
    };
    const check = validateAgainstSource(bag, draft);
    assert.equal(check.ok, true);
  });

  it("rejects invented foods and prose details", () => {
    const draft = {
      title: "For Rosa",
      remembrance:
        "Rosa Elena Vargas was a famous pianist in Paris who raced motorcycles every summer.",
      foods_used: ["tamales verdes"],
      songs_used: [],
      stories_used: [],
      offerings: [{ label: "tamales verdes", kind: "food" }],
      spoken_line: "We miss your concerts in Paris.",
    };
    const check = validateAgainstSource(bag, draft);
    assert.equal(check.ok, false);
    assert.ok(check.problems.some((p) => /food not in your list/i.test(p)));
    assert.deepEqual(inventedContent(bag, draft), ["tamales verdes"]);
  });
});

describe("parseModelJson", () => {
  it("normalizes offerings", () => {
    const draft = parseModelJson(
      JSON.stringify({
        title: "Light",
        remembrance: "A long enough remembrance about someone dear to keep.",
        foods_used: [],
        songs_used: [],
        stories_used: [],
        offerings: [{ label: "candle", kind: "weird" }],
        spoken_line: "Stay.",
      })
    );
    assert.equal(draft.offerings[0].kind, "candle");
  });
});

describe("lightCandela", () => {
  it("retries once then accepts a cleaned draft", async () => {
    let calls = 0;
    const result = await lightCandela(
      {
        name: "Rosa Elena Vargas",
        relationship: "Abuela",
        foods: "pan de muerto\ncafe de olla",
        songs: "Cielito Lindo",
        stories: "She tapped cinnamon twice before coffee.",
      },
      {
        config: { host: "http://example.test", model: "gemma3:4b", timeoutMs: 1000 },
        chatJson: async () => {
          calls += 1;
          if (calls === 1) {
            return JSON.stringify({
              title: "For Rosa",
              remembrance: "Rosa Elena Vargas raced motorcycles across Paris every summer night.",
              foods_used: ["tamales"],
              songs_used: [],
              stories_used: [],
              offerings: [{ label: "tamales", kind: "food" }],
              spoken_line: "Paris still echoes.",
            });
          }
          return JSON.stringify({
            title: "For Rosa",
            remembrance:
              "Rosa Elena Vargas is remembered with pan de muerto and cafe de olla. Cielito Lindo stays close. She tapped cinnamon twice before coffee, and the ofrenda keeps that quiet habit lit.",
            foods_used: ["pan de muerto", "cafe de olla"],
            songs_used: ["Cielito Lindo"],
            stories_used: ["She tapped cinnamon twice before coffee."],
            offerings: [
              { label: "pan de muerto", kind: "food" },
              { label: "Cielito Lindo", kind: "song" },
              { label: "candle", kind: "candle" },
            ],
            spoken_line: "Rosa, the cinnamon tin still remembers your hands.",
          });
        },
      }
    );
    assert.equal(calls, 2);
    assert.equal(result.retries, 1);
    assert.equal(result.grounded, true);
    assert.match(result.ofrenda.remembrance, /cinnamon/i);
  });
});
