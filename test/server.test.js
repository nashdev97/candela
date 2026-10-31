import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, it } from "node:test";
import { createApp } from "../src/server.js";
import { createStore } from "../src/store.js";

const here = path.dirname(fileURLToPath(import.meta.url));

describe("server", () => {
  let server;
  let tmp;

  after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (tmp) await rm(tmp, { recursive: true, force: true });
  });

  it("serves health, remembers, and history", async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), "candela-"));
    const store = createStore(path.join(tmp, "history.json"));
    server = createApp({
      store,
      health: async () => ({ ok: true, model: "gemma3:4b" }),
      remember: async (payload) => ({
        person: {
          name: payload.name,
          relationship: payload.relationship || "",
          years: "",
          foods: ["pan"],
          songs: ["song"],
          stories: ["story"],
        },
        ofrenda: {
          title: "For them",
          remembrance: "A remembrance grounded in the notes you gave tonight.",
          foods_used: ["pan"],
          songs_used: ["song"],
          stories_used: ["story"],
          offerings: [{ label: "candle", kind: "candle" }],
          spoken_line: "We remember.",
        },
        model: "gemma3:4b",
        retries: 0,
        grounded: true,
      }),
      publicRoot: path.join(here, "..", "src", "public"),
    });

    await new Promise((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });
    const { port } = server.address();
    const base = `http://127.0.0.1:${port}`;

    const health = await fetch(`${base}/api/health`).then((r) => r.json());
    assert.equal(health.ok, true);

    const created = await fetch(`${base}/api/remember`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Rosa",
        foods: "pan",
        songs: "song",
        stories: "story",
      }),
    }).then(async (r) => ({ status: r.status, body: await r.json() }));
    assert.equal(created.status, 200);
    assert.equal(created.body.person.name, "Rosa");

    const history = await fetch(`${base}/api/history`).then((r) => r.json());
    assert.equal(history.length, 1);
  });
});
