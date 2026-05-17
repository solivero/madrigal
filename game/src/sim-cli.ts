import { runSimulation, type BotKind, type SimResult } from "./sim";

function parseArgs(): {
  games: number;
  bot1: BotKind;
  bot2: BotKind;
  seed?: number;
  iterations: number;
} {
  const args = process.argv.slice(2);
  const get = (flag: string, fallback?: string) => {
    const idx = args.indexOf(flag);
    return idx >= 0 ? args[idx + 1] : fallback;
  };
  return {
    games: Number(get("--games", "20")),
    bot1: (get("--bot1", "random") as BotKind),
    bot2: (get("--bot2", "random") as BotKind),
    seed: get("--seed") ? Number(get("--seed")) : undefined,
    iterations: Number(get("--iterations", "30")),
  };
}

async function main() {
  const { games, bot1, bot2, seed, iterations } = parseArgs();
  console.log(
    `Running ${games} games: ${bot1} (P0) vs ${bot2} (P1)${
      seed !== undefined ? ` seed=${seed}` : ""
    } iterations=${iterations}\n`
  );

  const results: SimResult[] = [];
  let p0Wins = 0;
  let p1Wins = 0;
  let crashes = 0;
  const start = Date.now();

  for (let i = 0; i < games; i++) {
    const gameSeed = seed !== undefined ? seed + i : undefined;
    process.stdout.write(`  game ${i + 1}/${games} `);
    let r: SimResult;
    try {
      r = await runSimulation({
        bot0: bot1,
        bot1: bot2,
        seed: gameSeed,
        iterations,
      });
    } catch (e) {
      r = {
        winner: null,
        turns: 0,
        crashed: (e as Error).message,
        finalPoints: { "0": 0, "1": 0 },
        finalGames: { "0": 0, "1": 0 },
      };
    }
    results.push(r);
    if (r.crashed) {
      crashes++;
      console.log(`CRASH: ${r.crashed}`);
    } else if (r.winner === "0") {
      p0Wins++;
      console.log(`P0 won (${r.turns} turns, ${r.finalGames["0"]}–${r.finalGames["1"]})`);
    } else if (r.winner === "1") {
      p1Wins++;
      console.log(`P1 won (${r.turns} turns, ${r.finalGames["0"]}–${r.finalGames["1"]})`);
    } else {
      console.log(`tie (${r.turns} turns)`);
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const avgTurns =
    results.reduce((s, r) => s + r.turns, 0) / Math.max(results.length, 1);
  const maxTurns = Math.max(...results.map((r) => r.turns));

  console.log("\n" + "─".repeat(50));
  console.log(`Player 0 (${bot1}):  ${p0Wins}/${games} (${pct(p0Wins, games)})`);
  console.log(`Player 1 (${bot2}):  ${p1Wins}/${games} (${pct(p1Wins, games)})`);
  console.log(`Ties / crashes:     ${games - p0Wins - p1Wins}/${games}`);
  console.log(`Crashes alone:       ${crashes}`);
  console.log(`Avg turns:           ${avgTurns.toFixed(1)}`);
  console.log(`Slowest game:        ${maxTurns} turns`);
  console.log(`Elapsed:             ${elapsed}s`);
}

function pct(n: number, total: number) {
  return total === 0 ? "0%" : `${Math.round((n * 100) / total)}%`;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
