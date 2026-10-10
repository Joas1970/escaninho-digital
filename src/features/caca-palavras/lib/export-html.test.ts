import assert from "node:assert/strict";
import { test } from "node:test";
import { Script } from "node:vm";
import { buildStandaloneHtml } from "./export-html.ts";
import { generatePuzzle, parseWordList } from "./wordsearch.ts";

test("exported activity has executable JavaScript and escapes user content", () => {
  const html = buildStandaloneHtml({
    title: '</script><script>alert(1)</script>', prompt: 'Água & natureza',
    puzzle: generatePuzzle({words: parseWordList('água\nárvore'), difficulty: 'facil', seed: 42}),
    lives: 3, timer: true,
  });
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new Script(scripts[0][1]));
  assert.ok(!html.includes('<script>alert(1)</script>'));
});
