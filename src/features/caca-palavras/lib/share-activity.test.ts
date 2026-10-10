import assert from "node:assert/strict";
import { test } from "node:test";
import { activityLink, decodeActivity, encodeActivity, readActivityLink } from "./share-activity.ts";
import { cellsOf, generatePuzzle, parseWordList } from "./wordsearch.ts";

const activity = {
  id: "private-id", title: "Água e natureza", prompt: "Encontre as palavras.",
  wordsText: "água\nárvore\ncooperação", difficulty: "medio" as const,
  lives: 4, timer: true, seed: 42,
  image: "data:image/png;base64,aGVsbG8=",
};

test("shared activity retains Portuguese, image and deterministic puzzle without a local identity", async () => {
  const result = await decodeActivity(await encodeActivity(activity));
  assert.notEqual(result.id, activity.id);
  assert.deepEqual({ ...result, id: activity.id }, activity);
  const make = (a: typeof activity) => generatePuzzle({ words: parseWordList(a.wordsText), difficulty: a.difficulty, seed: a.seed });
  assert.deepEqual(make(result as typeof activity), make(activity));
  for (const p of make(activity).placements) {
    assert.equal(cellsOf(p).map((c) => make(activity).letters[c.row][c.col]).join(""), p.normalized);
  }
});

test("link uses page path, drops preview parameters and can omit image without changing the source", async () => {
  const link = await activityLink(activity, "https://example.org/atividades/caca?install=1#old", false);
  assert.ok(link.startsWith("https://example.org/atividades/caca#atividade="));
  const copy = await readActivityLink(link);
  assert.equal(copy?.image, undefined);
  assert.equal(activity.image, "data:image/png;base64,aGVsbG8=");
  assert.equal(await readActivityLink("https://example.org/"), null);
});

test("malformed links, unsafe images and invalid game settings are rejected", async () => {
  for (const token of ["", "2.abc", "1.!!!", "0." + "a".repeat(150_000)]) await assert.rejects(decodeActivity(token));
  await assert.rejects(encodeActivity({ ...activity, image: "https://tracker.example/photo.png" }));
  await assert.rejects(encodeActivity({ ...activity, seed: -1 }));
  await assert.rejects(encodeActivity({ ...activity, lives: 999 }));
  await assert.rejects(encodeActivity({ ...activity, title: "x".repeat(81) }));
  await assert.rejects(encodeActivity({ ...activity, wordsText: "árvore" + "—".repeat(32) }));
  await assert.rejects(activityLink(activity, "file:///atividade.html"));
});

test("decompression is bounded even for malicious small compressed payloads", async () => {
  const input = new TextEncoder().encode("a".repeat(200_000));
  const bytes = new Uint8Array(await new Response(new Blob([input]).stream().pipeThrough(new CompressionStream("deflate"))).arrayBuffer());
  const token = "1." + Buffer.from(bytes).toString("base64url");
  await assert.rejects(decodeActivity(token), /grande demais/);
});
