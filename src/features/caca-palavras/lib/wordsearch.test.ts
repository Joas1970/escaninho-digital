import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cellsOf, generatePuzzle, parseWordList, type Difficulty } from './wordsearch.ts';

test('words remain readable and never touch or overlap along the same line', () => {
  const words = parseWordList('agilidade\ncooperar\ncompetir\namizade\nincluir\nencaixe\nregras\ntem\ncor');
  for (const difficulty of ['facil', 'medio', 'dificil'] as Difficulty[]) {
    for (let seed = 0; seed < 100; seed++) {
      const puzzle = generatePuzzle({ words, difficulty, seed });
      assert.deepEqual(puzzle.missed, []);
      for (const [index, a] of puzzle.placements.entries()) {
        assert.equal(cellsOf(a).map(c => puzzle.letters[c.row][c.col]).join(''), a.normalized);
        for (const b of puzzle.placements.slice(index + 1)) {
          if (a.dr * b.dc !== a.dc * b.dr) continue;
          if ((b.row - a.row) * a.dc !== (b.col - a.col) * a.dr) continue;
          for (const ca of cellsOf(a)) for (const cb of cellsOf(b)) {
            assert.ok(Math.max(Math.abs(ca.row - cb.row), Math.abs(ca.col - cb.col)) > 1,
              `${difficulty}/${seed}: ${a.label} touches ${b.label}`);
          }
        }
      }
    }
  }
});
