// Prints the semantic changes between the committed data/charts.json (HEAD) and the working copy.
// Key order is ignored, so a reformatted file with no real changes prints "変更なし".
// Run: node scripts/diff-charts.js [base-ref]   (base-ref defaults to HEAD)
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC_JSON = path.join(ROOT, 'data', 'charts.json');

const DIFF_LABEL = { another: 'ANOTHER', hyper: 'HYPER', leggendaria: 'LEGGENDARIA' };

const oldData = JSON.parse(execSync(`git show ${process.argv[2] || 'HEAD'}:data/charts.json`, {
  cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
}));
const newData = JSON.parse(fs.readFileSync(SRC_JSON, 'utf8'));

function tiers(c) {
  return `ノマゲ${c.nomal_tier} / ハード${c.hard_tier}`;
}

function sameCharts(a, b) {
  const keys = Object.keys(a.charts);
  if (keys.length !== Object.keys(b.charts).length) return false;
  return keys.every((d) => b.charts[d]
    && a.charts[d].nomal_tier === b.charts[d].nomal_tier
    && a.charts[d].hard_tier === b.charts[d].hard_tier);
}

const added = Object.keys(newData).filter((t) => !(t in oldData));
const removed = Object.keys(oldData).filter((t) => !(t in newData));
const lines = [];

// A removed title whose charts match an added title is treated as a title rename.
for (const oldTitle of [...removed]) {
  const newTitle = added.find((t) => sameCharts(oldData[oldTitle], newData[t]));
  if (!newTitle) continue;
  lines.push(`曲名変更: ${oldTitle} → ${newTitle}`);
  removed.splice(removed.indexOf(oldTitle), 1);
  added.splice(added.indexOf(newTitle), 1);
}

for (const title of added) {
  for (const [diff, c] of Object.entries(newData[title].charts)) {
    lines.push(`譜面追加: ${title} ${DIFF_LABEL[diff] || diff}: ${tiers(c)}`);
  }
}

for (const title of removed) {
  for (const diff of Object.keys(oldData[title].charts)) {
    lines.push(`譜面削除: ${title} ${DIFF_LABEL[diff] || diff}`);
  }
}

for (const title of Object.keys(newData)) {
  if (!(title in oldData)) continue;
  const before = oldData[title];
  const after = newData[title];
  if (before.name_on_csv !== after.name_on_csv) {
    lines.push(`CSV名変更: ${title}: ${before.name_on_csv} → ${after.name_on_csv}`);
  }
  const diffs = new Set([...Object.keys(before.charts), ...Object.keys(after.charts)]);
  for (const diff of diffs) {
    const label = `${title} ${DIFF_LABEL[diff] || diff}`;
    const b = before.charts[diff];
    const a = after.charts[diff];
    if (!b) lines.push(`譜面追加: ${label}: ${tiers(a)}`);
    else if (!a) lines.push(`譜面削除: ${label}`);
    else if (b.nomal_tier !== a.nomal_tier || b.hard_tier !== a.hard_tier) {
      lines.push(`難易度変更: ${label}: ${tiers(b)} → ${tiers(a)}`);
    }
  }
}

console.log(lines.length ? lines.join('\n') : '変更なし');
