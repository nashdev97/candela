export function remembranceSchema() {
  return {
    type: "object",
    required: [
      "title",
      "remembrance",
      "foods_used",
      "songs_used",
      "stories_used",
      "offerings",
      "spoken_line",
    ],
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      remembrance: { type: "string" },
      foods_used: {
        type: "array",
        items: { type: "string" },
      },
      songs_used: {
        type: "array",
        items: { type: "string" },
      },
      stories_used: {
        type: "array",
        items: { type: "string" },
      },
      offerings: {
        type: "array",
        minItems: 1,
        maxItems: 6,
        items: {
          type: "object",
          required: ["label", "kind"],
          additionalProperties: false,
          properties: {
            label: { type: "string" },
            kind: { type: "string", enum: ["food", "song", "story", "candle", "photo"] },
          },
        },
      },
      spoken_line: { type: "string" },
    },
  };
}
