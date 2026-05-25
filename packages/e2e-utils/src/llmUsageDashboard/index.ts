import * as fs from 'node:fs';
import * as path from 'node:path';

import type { UsageRecord } from '../tokenUsage';

const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const PRICE_INPUT_PER_MTOK = 15;
const PRICE_OUTPUT_PER_MTOK = 75;

const estimateCost = (r: UsageRecord): number => {
    if (r.input_tokens == null || r.output_tokens == null) return 0;

    return (
        (r.input_tokens / 1_000_000) * PRICE_INPUT_PER_MTOK +
        (r.output_tokens / 1_000_000) * PRICE_OUTPUT_PER_MTOK
    );
};

const toDateStr = (ts: string) => ts.slice(0, 10); // YYYY-MM-DD

const groupByDateAndScript = (records: UsageRecord[]) => {
    const byDate: Record<
        string,
        Record<string, { input: number; output: number; cost: number }>
    > = {};

    for (const r of records) {
        const date = toDateStr(r.timestamp);
        byDate[date] ??= {};
        const byScript = byDate[date];

        byScript[r.script] ??= { input: 0, output: 0, cost: 0 };
        // @ts-expect-error: noUncheckedIndexedAccess
        const entry: { input: number; output: number; cost: number } = byScript[r.script];

        entry.input += r.input_tokens ?? 0;
        entry.output += r.output_tokens ?? 0;
        entry.cost += estimateCost(r);
    }

    return byDate;
};

const generateHtml = (records: UsageRecord[]): string => {
    const scripts = [...new Set(records.map(r => r.script))].sort();
    const byDate = groupByDateAndScript(records);
    const dates = Object.keys(byDate).sort();

    const recentRuns = [...records]
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, 50);

    const chartDatasets = scripts.flatMap((script, i) => {
        const colors = ['#3b82f6', '#f97316', '#22c55e', '#a855f7'];
        const color = colors[i % colors.length];

        return [
            {
                label: `${script} — input`,
                data: dates.map(d => byDate[d]?.[script]?.input ?? 0),
                borderColor: color,
                backgroundColor: `${color}33`,
                fill: false,
                tension: 0.3,
            },
            {
                label: `${script} — output`,
                data: dates.map(d => byDate[d]?.[script]?.output ?? 0),
                borderColor: color,
                backgroundColor: `${color}22`,
                borderDash: [5, 3],
                fill: false,
                tension: 0.3,
            },
        ];
    });

    const costDatasets = scripts.map((script, i) => {
        const colors = ['#3b82f6', '#f97316', '#22c55e', '#a855f7'];

        return {
            label: script,
            data: dates.map(d => parseFloat((byDate[d]?.[script]?.cost ?? 0).toFixed(4))),
            backgroundColor: colors[i % colors.length],
        };
    });

    const tableRows = recentRuns
        .map(r => {
            const cost = estimateCost(r).toFixed(4);
            const input = r.input_tokens != null ? `${(r.input_tokens / 1000).toFixed(1)}k` : 'n/a';
            const output =
                r.output_tokens != null ? `${(r.output_tokens / 1000).toFixed(1)}k` : 'n/a';

            return `<tr>
        <td>${r.timestamp.replace('T', ' ').slice(0, 19)}</td>
        <td>${escapeHtml(r.script)}</td>
        <td>${escapeHtml(r.model)}</td>
        <td>${input}</td>
        <td>${output}</td>
        <td>$${cost}</td>
        <td>${escapeHtml(r.source)}</td>
        <td>${r.workflow != null ? escapeHtml(r.workflow) : '—'}</td>
        <td>${escapeHtml(r.run_id)}</td>
      </tr>`;
        })
        .join('\n');

    const chartData = JSON.stringify({ labels: dates, datasets: chartDatasets });
    const costData = JSON.stringify({ labels: dates, datasets: costDatasets });

    const totalRecords = records.length;
    const totalCost = records.reduce((sum, r) => sum + estimateCost(r), 0).toFixed(4);
    const totalInput = records.reduce((sum, r) => sum + (r.input_tokens ?? 0), 0);
    const totalOutput = records.reduce((sum, r) => sum + (r.output_tokens ?? 0), 0);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LLM Token Usage Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.js" integrity="sha256-5M9NFEsiJjTy5k/3B81XuVP43ktlsjHNWsa94RRkjk0=" crossorigin="anonymous"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .subtitle { color: #94a3b8; font-size: 0.875rem; margin-bottom: 2rem; }
    .stats { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
    .stat { background: #1e293b; border-radius: 0.5rem; padding: 1rem 1.5rem; flex: 1; min-width: 140px; }
    .stat-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-value { font-size: 1.5rem; font-weight: 600; margin-top: 0.25rem; }
    .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
    @media (max-width: 900px) { .charts { grid-template-columns: 1fr; } }
    .chart-box { background: #1e293b; border-radius: 0.5rem; padding: 1.25rem; }
    .chart-title { font-size: 0.875rem; font-weight: 600; color: #94a3b8; margin-bottom: 1rem; }
    canvas { max-height: 280px; }
    .table-box { background: #1e293b; border-radius: 0.5rem; padding: 1.25rem; overflow-x: auto; }
    .table-title { font-size: 0.875rem; font-weight: 600; color: #94a3b8; margin-bottom: 1rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    th { text-align: left; color: #64748b; padding: 0.4rem 0.75rem; border-bottom: 1px solid #334155; }
    td { padding: 0.4rem 0.75rem; border-bottom: 1px solid #1e293b; }
    tr:hover td { background: #0f172a; }
  </style>
</head>
<body>
  <h1>LLM Token Usage Dashboard</h1>
  <p class="subtitle">Generated ${new Date().toISOString().slice(0, 19)} UTC &nbsp;·&nbsp; Prices: $${PRICE_INPUT_PER_MTOK}/MTok input, $${PRICE_OUTPUT_PER_MTOK}/MTok output (claude-opus-4-6)</p>

  <div class="stats">
    <div class="stat"><div class="stat-label">Total runs</div><div class="stat-value">${totalRecords}</div></div>
    <div class="stat"><div class="stat-label">Total input tokens</div><div class="stat-value">${(totalInput / 1000).toFixed(1)}k</div></div>
    <div class="stat"><div class="stat-label">Total output tokens</div><div class="stat-value">${(totalOutput / 1000).toFixed(1)}k</div></div>
    <div class="stat"><div class="stat-label">Total est. cost</div><div class="stat-value">$${totalCost}</div></div>
  </div>

  <div class="charts">
    <div class="chart-box">
      <div class="chart-title">Daily token usage per script</div>
      <canvas id="tokensChart"></canvas>
    </div>
    <div class="chart-box">
      <div class="chart-title">Daily estimated cost per script (USD)</div>
      <canvas id="costChart"></canvas>
    </div>
  </div>

  <div class="table-box">
    <div class="table-title">Recent runs (last 50)</div>
    <table>
      <thead><tr>
        <th>Timestamp</th><th>Script</th><th>Model</th><th>Input</th><th>Output</th><th>Est. Cost</th><th>Source</th><th>Workflow</th><th>Run ID</th>
      </tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>

  <script>
    const tokensData = ${chartData};
    const costData = ${costData};

    new Chart(document.getElementById('tokensChart'), {
      type: 'line',
      data: tokensData,
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
        scales: {
          x: { ticks: { color: '#64748b', maxRotation: 45 }, grid: { color: '#1e293b' } },
          y: { ticks: { color: '#64748b' }, grid: { color: '#334155' } },
        },
      },
    });

    new Chart(document.getElementById('costChart'), {
      type: 'bar',
      data: costData,
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
        scales: {
          x: { stacked: true, ticks: { color: '#64748b', maxRotation: 45 }, grid: { color: '#1e293b' } },
          y: { stacked: true, ticks: { color: '#64748b', callback: v => '$' + v }, grid: { color: '#334155' } },
        },
      },
    });
  </script>
</body>
</html>`;
};

const main = () => {
    const args = process.argv.slice(2);
    const inputFile = args[0];
    const outputFile = args[1] ?? 'llm-usage-dashboard.html';

    if (!inputFile) {
        process.stderr.write('Usage: generate-usage-dashboard <aggregated.json> [output.html]\n');
        process.exit(1);
    }

    const raw = fs.readFileSync(inputFile, 'utf8');
    const records: UsageRecord[] = JSON.parse(raw);

    if (!Array.isArray(records)) {
        process.stderr.write('Input must be a JSON array of usage records.\n');
        process.exit(1);
    }

    const html = generateHtml(records);
    const outPath = path.resolve(outputFile);
    fs.writeFileSync(outPath, html, 'utf8');
    process.stderr.write(`Dashboard written to ${outPath} (${records.length} records)\n`);
};

main();
