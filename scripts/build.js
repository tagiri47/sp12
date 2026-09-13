// Builds index.html by embedding data/charts.json into a single static page.
// Run: node scripts/build.js
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC_JSON = path.join(ROOT, 'data', 'charts.json');
const CHANGELOG_PATH = path.join(ROOT, 'CHANGELOG.md');
const OUT_HTML = path.join(ROOT, 'index.html');

const raw = JSON.parse(fs.readFileSync(SRC_JSON, 'utf8'));

function parseChangelog(markdown) {
  const entries = [];
  for (const line of markdown.split('\n')) {
    const m = line.match(/^-\s*(\d{4}\/\d{2}\/\d{2}):\s*(.+)$/);
    if (m) entries.push({ date: m[1], text: m[2].trim() });
  }
  entries.sort((a, b) => b.date.localeCompare(a.date));
  return entries;
}

const changelog = parseChangelog(fs.readFileSync(CHANGELOG_PATH, 'utf8'));

const DIFF_LABEL = { another: 'A', hyper: 'H', leggendaria: 'L' };

const entries = [];
for (const title of Object.keys(raw)) {
  const song = raw[title];
  for (const diff of Object.keys(song.charts)) {
    const c = song.charts[diff];
    entries.push({
      title,
      csv: song.name_on_csv,
      diff,
      diffLabel: DIFF_LABEL[diff] || diff,
      nomal: c.nomal_tier,
      hard: c.hard_tier,
    });
  }
}

entries.sort((a, b) => a.title.localeCompare(b.title, 'ja'));

const TIERS = [
  '地力S+', '個人差S+',
  '地力S', '個人差S',
  '地力A+', '個人差A+',
  '地力A', '個人差A',
  '地力B+', '個人差B+',
  '地力B', '個人差B',
  '地力C', '個人差C',
  '地力D', '個人差D',
  '地力E', '個人差E',
  '地力F', '個人差F',
];

const template = fs.readFileSync(path.join(ROOT, 'scripts', 'index.template.html'), 'utf8');
const html = template
  .replace('__CHART_DATA__', JSON.stringify(entries))
  .replace('__TIER_ORDER__', JSON.stringify(TIERS))
  .replace('__CHANGELOG__', JSON.stringify(changelog));

fs.writeFileSync(OUT_HTML, html, 'utf8');
console.log(`Wrote ${OUT_HTML} with ${entries.length} chart entries.`);
