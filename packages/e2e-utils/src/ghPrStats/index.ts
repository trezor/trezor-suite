import { Octokit } from '@octokit/rest';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface PrNode {
    number: number;
    title: string;
    additions: number;
    deletions: number;
    mergedAt: string;
    updatedAt: string;
    url: string;
}

interface PrData extends PrNode {
    changes: number;
}

interface GraphqlResponse {
    repository: {
        pullRequests: {
            nodes: PrNode[];
            pageInfo: { hasNextPage: boolean; endCursor: string };
        };
    };
}

const BUCKETS: { label: string; min: number; max: number }[] = [
    { label: '0–10', min: 0, max: 10 },
    { label: '11–50', min: 11, max: 50 },
    { label: '51–100', min: 51, max: 100 },
    { label: '101–250', min: 101, max: 250 },
    { label: '251–500', min: 251, max: 500 },
    { label: '501–1k', min: 501, max: 1_000 },
    { label: '1k–2.5k', min: 1_001, max: 2_500 },
    { label: '2.5k–5k', min: 2_501, max: 5_000 },
    { label: '5k+', min: 5_001, max: Infinity },
];

const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const average = (values: number[]): number =>
    values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;

const median = (values: number[]): number => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    return sorted.length % 2 === 0
        ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
        : (sorted[mid] ?? 0);
};

const percentile = (values: number[], p: number): number => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = (p / 100) * (sorted.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo] ?? 0;
    const frac = idx - lo;

    return (sorted[lo] ?? 0) * (1 - frac) + (sorted[hi] ?? 0) * frac;
};

const getBucketIndex = (changes: number): number => {
    for (let i = 0; i < BUCKETS.length; i++) {
        const b = BUCKETS[i]!;
        if (changes >= b.min && changes <= b.max) return i;
    }

    return BUCKETS.length - 1;
};

async function fetchMergedPrs(
    octokit: Octokit,
    owner: string,
    repo: string,
    since: Date,
): Promise<PrData[]> {
    const prs: PrData[] = [];
    let cursor: string | null = null;
    let done = false;

    while (!done) {
        const data: GraphqlResponse = await octokit.graphql(
            `
            query($owner: String!, $repo: String!, $cursor: String) {
                repository(owner: $owner, name: $repo) {
                    pullRequests(
                        first: 100
                        states: [MERGED]
                        orderBy: { field: UPDATED_AT, direction: DESC }
                        after: $cursor
                    ) {
                        nodes {
                            number
                            title
                            additions
                            deletions
                            mergedAt
                            updatedAt
                            url
                        }
                        pageInfo {
                            hasNextPage
                            endCursor
                        }
                    }
                }
            }
        `,
            { owner, repo, cursor },
        );

        const prList = data.repository.pullRequests;

        for (const pr of prList.nodes) {
            if (pr.mergedAt && new Date(pr.mergedAt) >= since) {
                prs.push({ ...pr, changes: pr.additions + pr.deletions });
            }
        }

        // Safe stopping condition: updatedAt >= mergedAt always, so once the entire
        // page's oldest updatedAt is before `since`, no further page can contain
        // PRs merged within our window.
        const oldestUpdatedAt = prList.nodes.reduce<string | null>(
            (min, pr) => (min === null || pr.updatedAt < min ? pr.updatedAt : min),
            null,
        );
        if (
            !prList.pageInfo.hasNextPage ||
            (oldestUpdatedAt !== null && new Date(oldestUpdatedAt) < since)
        ) {
            done = true;
        } else {
            cursor = prList.pageInfo.endCursor;
        }
    }

    return prs;
}

const generateHtml = (prs: PrData[], owner: string, repo: string, days: number): string => {
    const changes = prs.map(p => p.changes);
    const avg = average(changes);
    const med = median(changes);
    const p75 = percentile(changes, 75);
    const p90 = percentile(changes, 90);
    const p95 = percentile(changes, 95);

    const bucketCounts = BUCKETS.map(() => 0);
    for (const c of changes) {
        const idx = getBucketIndex(c);
        bucketCounts[idx] = (bucketCounts[idx] ?? 0) + 1;
    }

    const sortedChanges = [...changes].sort((a, b) => a - b);

    const top20Rows = [...prs]
        .sort((a, b) => b.changes - a.changes)
        .slice(0, 20)
        .map(pr => {
            const title = pr.title.length > 72 ? pr.title.slice(0, 72) + '…' : pr.title;

            return `<tr>
          <td><a href="${escapeHtml(pr.url)}" target="_blank">#${pr.number}</a></td>
          <td title="${escapeHtml(pr.title)}">${escapeHtml(title)}</td>
          <td class="num">+${pr.additions.toLocaleString()}</td>
          <td class="num">-${pr.deletions.toLocaleString()}</td>
          <td class="num">${pr.changes.toLocaleString()}</td>
          <td>${pr.mergedAt.slice(0, 10)}</td>
        </tr>`;
        })
        .join('\n');

    const histogramData = JSON.stringify({
        labels: BUCKETS.map(b => b.label),
        datasets: [
            {
                label: 'PRs',
                data: bucketCounts,
                backgroundColor: '#3b82f6cc',
                borderColor: '#3b82f6',
                borderWidth: 1,
            },
        ],
    });

    const sortedData = JSON.stringify({
        labels: sortedChanges.map((_, i) => i + 1),
        datasets: [
            {
                label: 'Changes',
                data: sortedChanges,
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34,197,94,0.08)',
                fill: true,
                pointRadius: sortedChanges.length <= 150 ? 3 : 0,
                tension: 0.2,
            },
        ],
    });

    const sinceDate = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
    const generatedAt = new Date().toISOString().slice(0, 19) + ' UTC';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PR Stats — ${escapeHtml(owner)}/${escapeHtml(repo)}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.js" integrity="sha256-5M9NFEsiJjTy5k/3B81XuVP43ktlsjHNWsa94RRkjk0=" crossorigin="anonymous"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .subtitle { color: #94a3b8; font-size: 0.875rem; margin-bottom: 2rem; }
    .stats { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
    .stat { background: #1e293b; border-radius: 0.5rem; padding: 1rem 1.5rem; flex: 1; min-width: 120px; }
    .stat-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-value { font-size: 1.5rem; font-weight: 600; margin-top: 0.25rem; }
    .stat-sub { font-size: 0.75rem; color: #94a3b8; margin-top: 0.2rem; }
    .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
    @media (max-width: 900px) { .charts { grid-template-columns: 1fr; } }
    .chart-box { background: #1e293b; border-radius: 0.5rem; padding: 1.25rem; }
    .chart-title { font-size: 0.875rem; font-weight: 600; color: #94a3b8; margin-bottom: 1rem; }
    canvas { max-height: 300px; }
    .table-box { background: #1e293b; border-radius: 0.5rem; padding: 1.25rem; overflow-x: auto; }
    .table-title { font-size: 0.875rem; font-weight: 600; color: #94a3b8; margin-bottom: 1rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    th { text-align: left; color: #64748b; padding: 0.4rem 0.75rem; border-bottom: 1px solid #334155; white-space: nowrap; }
    td { padding: 0.4rem 0.75rem; border-bottom: 1px solid #1e293b; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    tr:hover td { background: #0f172a; }
    a { color: #60a5fa; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>PR Stats — ${escapeHtml(owner)}/${escapeHtml(repo)}</h1>
  <p class="subtitle">Merged PRs from ${sinceDate} &bull; Generated ${generatedAt}</p>

  <div class="stats">
    <div class="stat">
      <div class="stat-label">Total merged PRs</div>
      <div class="stat-value">${prs.length.toLocaleString()}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Average changes</div>
      <div class="stat-value">${Math.round(avg).toLocaleString()}</div>
      <div class="stat-sub">additions + deletions</div>
    </div>
    <div class="stat">
      <div class="stat-label">Median changes</div>
      <div class="stat-value">${Math.round(med).toLocaleString()}</div>
    </div>
    <div class="stat">
      <div class="stat-label">P75</div>
      <div class="stat-value">${Math.round(p75).toLocaleString()}</div>
    </div>
    <div class="stat">
      <div class="stat-label">P90</div>
      <div class="stat-value">${Math.round(p90).toLocaleString()}</div>
    </div>
    <div class="stat">
      <div class="stat-label">P95</div>
      <div class="stat-value">${Math.round(p95).toLocaleString()}</div>
    </div>
  </div>

  <div class="charts">
    <div class="chart-box">
      <div class="chart-title">Distribution of PR changes (histogram)</div>
      <canvas id="histChart"></canvas>
    </div>
    <div class="chart-box">
      <div class="chart-title">PR changes sorted ascending</div>
      <canvas id="sortedChart"></canvas>
    </div>
  </div>

  <div class="table-box">
    <div class="table-title">Top 20 largest PRs by total changes</div>
    <table>
      <thead><tr>
        <th>PR</th><th>Title</th><th>Additions</th><th>Deletions</th><th>Total</th><th>Merged at</th>
      </tr></thead>
      <tbody>
        ${top20Rows}
      </tbody>
    </table>
  </div>

  <script>
    new Chart(document.getElementById('histChart'), {
      type: 'bar',
      data: ${histogramData},
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#64748b' }, grid: { color: '#334155' } },
          y: { ticks: { color: '#64748b', precision: 0 }, grid: { color: '#334155' },
               title: { display: true, text: 'Number of PRs', color: '#64748b' } },
        },
      },
    });

    new Chart(document.getElementById('sortedChart'), {
      type: 'line',
      data: ${sortedData},
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: '#64748b', maxTicksLimit: 8 },
            grid: { color: '#334155' },
            title: { display: true, text: 'PR rank (smallest → largest)', color: '#64748b' },
          },
          y: {
            ticks: { color: '#64748b' },
            grid: { color: '#334155' },
            title: { display: true, text: 'Total changes', color: '#64748b' },
          },
        },
      },
    });
  </script>
</body>
</html>`;
};

const main = async () => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        process.stderr.write('Error: GITHUB_TOKEN environment variable is required\n');
        process.exit(1);
    }

    const args = process.argv.slice(2);
    const repoArg = args[0] ?? process.env.GITHUB_REPO;
    if (!repoArg?.includes('/')) {
        process.stderr.write(
            'Usage: gh-pr-stats <owner/repo> [output.html]\n' +
                '  or set GITHUB_REPO=owner/repo in environment\n',
        );
        process.exit(1);
    }

    const [owner, repo] = repoArg.split('/') as [string, string];
    const outputFile = args[1] ?? 'pr-stats.html';
    const days = 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    process.stderr.write(
        `Fetching merged PRs for ${owner}/${repo} since ${since.toISOString().slice(0, 10)}...\n`,
    );

    const octokit = new Octokit({ auth: token });
    const prs = await fetchMergedPrs(octokit, owner, repo, since);

    process.stderr.write(`Fetched ${prs.length} PRs. Generating report...\n`);

    if (prs.length === 0) {
        process.stderr.write('No merged PRs found in the last 30 days.\n');
    }

    const html = generateHtml(prs, owner, repo, days);
    const outPath = path.resolve(outputFile);
    fs.writeFileSync(outPath, html, 'utf8');
    process.stderr.write(`Report written to ${outPath}\n`);
};

main().catch(err => {
    process.stderr.write(`Error: ${(err as Error).message}\n`);
    process.exit(1);
});
