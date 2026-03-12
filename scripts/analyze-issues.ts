#!/usr/bin/env tsx
/**
 * Analyze open GitHub issues in trezor/trezor-suite:
 *   1. Identify potential duplicate issues (by title similarity and cross-references)
 *   2. Identify potentially completed issues (by age, inactivity, or content clues)
 *   3. Categorize issues as Growth team vs. other teams
 *
 * Usage:
 *   GH_TOKEN=<token> tsx scripts/analyze-issues.ts [--output <file>]
 *   gh auth login && tsx scripts/analyze-issues.ts [--output <file>]
 *
 * Options:
 *   --output <file>   Write the markdown report to a file instead of stdout
 *   --json            Output raw JSON data instead of a markdown report
 */

import fs from 'node:fs';
import process from 'node:process';

const REPO_OWNER = 'trezor';
const REPO_NAME = 'trezor-suite';
const GITHUB_API_BASE = 'https://api.github.com';

// ---------------------------------------------------------------------------
// Growth team heuristics
// ---------------------------------------------------------------------------
// Suite-Growth 🎨 owns: design system, UI/UX, localization, onboarding visuals,
// analytics instrumentation, and animation/charting libraries.
// See scripts/list-outdated-dependencies/growth-dependencies.txt for the full list
// of packages they are responsible for.

const GROWTH_LABELS = new Set([
    'design-system',
    'UI',
    'translations',
    'data',
    'onboarding',
    'notifications',
    'graph',
    'dashboard',
    'guide',
]);

// Keywords in titles that suggest a Growth-team issue (more specific patterns to
// avoid false positives from generic terms like "button" or "select")
const GROWTH_TITLE_KEYWORDS = [
    'ds update',
    '– ds update',
    '- ds update',
    'design system',
    'analytics',
    'storybook',
    'onboarding',
    'survey',
    'animation',
    'illustration',
    'pictogram',
    'badge',
    'button component',
    'textinput',
    'searchinput',
    'tabs - ds',
    'subtabs - ds',
    'select - ds',
    'select component',
    'switch component',
    'checkbox component',
    'radio component',
    'roundedicon',
    'textbutton',
    'icon button',
    'iconbutton',
    'flag component',
    'recharts',
    'chart tooltip',
    'guide button',
    'suite guide',
];

// ---------------------------------------------------------------------------
// Completion heuristics
// ---------------------------------------------------------------------------
// An issue is a candidate for "possibly completed" when it meets one or more of:
//   - It has had no updates for more than 9 months
//   - Its title contains keywords that suggest it was a spike/research and those are
//     usually resolved in follow-up work
//   - The title includes "[WIP Placeholder Issue]" or similar

const POSSIBLY_DONE_TITLE_PATTERNS = [
    /\[wip placeholder\]/i,
    /spike[\s:-]/i,
    /\[spike\]/i,
    /research[\s:-]/i,
    /\[research\]/i,
    /\[done\]/i,
    /\[completed\]/i,
    /\[obsolete\]/i,
    /\[draft\]/i,
];

// Issues with no update for 9+ months are candidates for review/close
const STALE_THRESHOLD_MS = 9 * 30 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GithubIssue {
    number: number;
    title: string;
    state: string;
    html_url: string;
    created_at: string;
    updated_at: string;
    labels: { name: string }[];
    body: string | null;
    user: { login: string };
    pull_request?: object;
}

interface AnalysisResult {
    issues: GithubIssue[];
    duplicateGroups: DuplicateGroup[];
    possiblyCompleted: PossiblyCompleted[];
    growthIssues: GithubIssue[];
    otherIssues: GithubIssue[];
}

interface DuplicateGroup {
    reason: string;
    issues: Pick<GithubIssue, 'number' | 'title' | 'html_url'>[];
}

interface PossiblyCompleted {
    reason: string;
    issue: Pick<GithubIssue, 'number' | 'title' | 'html_url' | 'updated_at'>;
}

// ---------------------------------------------------------------------------
// GitHub API helpers
// ---------------------------------------------------------------------------

function getToken(): string | undefined {
    return process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
}

async function githubFetch<T>(path: string): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${GITHUB_API_BASE}${path}`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
        throw new Error(`GitHub API error ${res.status} for ${url}: ${await res.text()}`);
    }

    return res.json() as Promise<T>;
}

async function fetchAllIssues(): Promise<GithubIssue[]> {
    const all: GithubIssue[] = [];
    let page = 1;

    while (true) {
        const items = await githubFetch<GithubIssue[]>(
            `/repos/${REPO_OWNER}/${REPO_NAME}/issues?state=open&per_page=100&page=${page}`,
        );

        if (items.length === 0) break;

        // Exclude pull requests (GitHub API returns both issues and PRs here)
        const issuesOnly = items.filter(i => !i.pull_request);
        all.push(...issuesOnly);

        if (items.length < 100) break;
        page++;
    }

    return all;
}

// ---------------------------------------------------------------------------
// Duplicate detection
// ---------------------------------------------------------------------------

/**
 * Normalise a title for comparison: lower-case, strip punctuation, squash
 * spaces, drop very common words ("the", "a", "an", "in", etc.).
 */
function normalizeTitle(title: string): string {
    const stopwords = new Set([
        'a',
        'an',
        'the',
        'in',
        'on',
        'at',
        'of',
        'for',
        'to',
        'and',
        'or',
        'with',
        'is',
        'are',
        'be',
        'by',
    ]);

    return title
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopwords.has(w))
        .join(' ');
}

/**
 * Simple Jaccard similarity: |A ∩ B| / |A ∪ B| over word sets.
 */
function jaccardSimilarity(a: string, b: string): number {
    const setA = new Set(normalizeTitle(a).split(' ').filter(Boolean));
    const setB = new Set(normalizeTitle(b).split(' ').filter(Boolean));

    if (setA.size === 0 || setB.size === 0) return 0;

    const intersection = new Set([...setA].filter(w => setB.has(w)));
    const union = new Set([...setA, ...setB]);

    return intersection.size / union.size;
}

/**
 * Check if issue B's body or title contains a cross-reference to issue A.
 */
function crossReferences(a: GithubIssue, b: GithubIssue): boolean {
    const refPattern = new RegExp(`#${a.number}\\b`);

    return refPattern.test(b.title) || refPattern.test(b.body ?? '');
}

// Higher threshold reduces false positives (companion issues sharing many words)
const SIMILARITY_THRESHOLD = 0.70;

/**
 * Some issues are intentionally created per-team with near-identical titles
 * (e.g., monthly dependency bumps).  Skip those in the similarity check so we
 * don't flag them as duplicates of each other.
 */
function isIntentionallyParallelIssue(issue: GithubIssue): boolean {
    const lower = issue.title.toLowerCase();

    // Monthly dependency bump issues are created once per team on purpose
    return lower.startsWith('bump ') && lower.includes(' deps ');
}

function findDuplicates(issues: GithubIssue[]): DuplicateGroup[] {
    const groups: DuplicateGroup[] = [];
    const grouped = new Set<number>();

    for (let i = 0; i < issues.length; i++) {
        if (grouped.has(issues[i].number)) continue;
        if (isIntentionallyParallelIssue(issues[i])) continue;

        const similar: GithubIssue[] = [issues[i]];

        for (let j = i + 1; j < issues.length; j++) {
            if (grouped.has(issues[j].number)) continue;
            if (isIntentionallyParallelIssue(issues[j])) continue;

            const sim = jaccardSimilarity(issues[i].title, issues[j].title);
            const crossRef =
                crossReferences(issues[i], issues[j]) || crossReferences(issues[j], issues[i]);

            if (sim >= SIMILARITY_THRESHOLD || crossRef) {
                similar.push(issues[j]);
                grouped.add(issues[j].number);
            }
        }

        if (similar.length > 1) {
            grouped.add(issues[i].number);
            const hasCrossRef = similar
                .slice(1)
                .some(b => crossReferences(similar[0], b) || crossReferences(b, similar[0]));

            groups.push({
                reason: hasCrossRef ? 'cross-referenced' : 'similar title',
                issues: similar.map(({ number, title, html_url }) => ({
                    number,
                    title,
                    html_url,
                })),
            });
        }
    }

    return groups;
}

// ---------------------------------------------------------------------------
// Possibly-completed detection
// ---------------------------------------------------------------------------

function findPossiblyCompleted(issues: GithubIssue[]): PossiblyCompleted[] {
    const now = Date.now();

    return issues
        .filter(issue => {
            const updatedAt = new Date(issue.updated_at).getTime();
            const patternMatch = POSSIBLY_DONE_TITLE_PATTERNS.some(p => p.test(issue.title));
            const noActivityLong = now - updatedAt > STALE_THRESHOLD_MS;

            // Flag if title pattern matches, or if stale for > 9 months
            return patternMatch || noActivityLong;
        })
        .map(issue => {
            const updatedAt = new Date(issue.updated_at).getTime();
            const patternMatch = POSSIBLY_DONE_TITLE_PATTERNS.some(p => p.test(issue.title));
            const monthsInactive = Math.floor((now - updatedAt) / (30 * 24 * 60 * 60 * 1000));

            let reason: string;
            if (patternMatch) {
                reason = 'title suggests spike/research/placeholder — check if resolved';
            } else {
                reason = `no activity for ${monthsInactive} months`;
            }

            return {
                reason,
                issue: {
                    number: issue.number,
                    title: issue.title,
                    html_url: issue.html_url,
                    updated_at: issue.updated_at,
                },
            };
        })
        .sort(
            (a, b) =>
                new Date(a.issue.updated_at).getTime() - new Date(b.issue.updated_at).getTime(),
        );
}

// ---------------------------------------------------------------------------
// Team categorization
// ---------------------------------------------------------------------------

function isGrowthIssue(issue: GithubIssue): boolean {
    const labels = issue.labels.map(l => l.name);

    if (labels.some(l => GROWTH_LABELS.has(l))) return true;

    const titleLower = issue.title.toLowerCase();

    if (GROWTH_TITLE_KEYWORDS.some(kw => titleLower.includes(kw))) return true;

    return false;
}

// ---------------------------------------------------------------------------
// Markdown report
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
    return new Date(iso).toISOString().slice(0, 10);
}

function issueLink(issue: { number: number; title: string; html_url: string }): string {
    return `[#${issue.number} ${issue.title}](${issue.html_url})`;
}

function buildReport(result: AnalysisResult): string {
    const now = new Date().toISOString().slice(0, 10);
    const lines: string[] = [];

    lines.push(`# Trezor Suite – Open Issue Analysis (${now})`);
    lines.push('');
    lines.push(
        `Analysed **${result.issues.length}** open issues in [trezor/trezor-suite](https://github.com/trezor/trezor-suite/issues).`,
    );
    lines.push('');

    // Summary table
    lines.push('## Summary');
    lines.push('');
    lines.push('| Category | Count |');
    lines.push('|---|---|');
    lines.push(`| Total open issues | ${result.issues.length} |`);
    lines.push(`| Duplicate groups found | ${result.duplicateGroups.length} |`);
    lines.push(`| Possibly-completed issues | ${result.possiblyCompleted.length} |`);
    lines.push(`| Growth team issues | ${result.growthIssues.length} |`);
    lines.push(`| Other team issues | ${result.otherIssues.length} |`);
    lines.push('');

    // Duplicate groups
    lines.push('---');
    lines.push('');
    lines.push('## 1. Potential Duplicates');
    lines.push('');
    lines.push(
        'These issues appear to cover the same area or cross-reference each other. ' +
            'Consider merging, closing the older one, or adding `duplicate` labels.',
    );
    lines.push('');

    if (result.duplicateGroups.length === 0) {
        lines.push('_No potential duplicates detected._');
    } else {
        result.duplicateGroups.forEach((group, idx) => {
            lines.push(`### Group ${idx + 1} — ${group.reason}`);
            lines.push('');
            group.issues.forEach(i => {
                lines.push(`- ${issueLink(i)}`);
            });
            lines.push('');
        });
    }

    // Possibly completed
    lines.push('---');
    lines.push('');
    lines.push('## 2. Possibly Completed / Stale Issues');
    lines.push('');
    lines.push(
        'These issues have had no activity for a long time or their title suggests a ' +
            'spike/research task that was probably resolved. Review and close if appropriate.',
    );
    lines.push('');

    if (result.possiblyCompleted.length === 0) {
        lines.push('_No stale or possibly-completed issues detected._');
    } else {
        lines.push('| Issue | Last updated | Reason |');
        lines.push('|---|---|---|');
        result.possiblyCompleted.forEach(({ issue, reason }) => {
            lines.push(
                `| ${issueLink(issue)} | ${formatDate(issue.updated_at)} | ${reason} |`,
            );
        });
    }
    lines.push('');

    // Growth team issues
    lines.push('---');
    lines.push('');
    lines.push('## 3. Growth Team Issues');
    lines.push('');
    lines.push(
        'Issues categorised as **Suite-Growth 🎨** based on labels (`design-system`, `UI`, ' +
            '`translations`, `data`, `onboarding`, `graph`, `dashboard`, `notifications`, ' +
            '`guide`) or title keywords.',
    );
    lines.push('');

    if (result.growthIssues.length === 0) {
        lines.push('_No Growth team issues found._');
    } else {
        lines.push('| Issue | Labels | Last updated |');
        lines.push('|---|---|---|');
        result.growthIssues.forEach(issue => {
            const labelStr = issue.labels.map(l => `\`${l.name}\``).join(' ') || '—';
            lines.push(
                `| ${issueLink(issue)} | ${labelStr} | ${formatDate(issue.updated_at)} |`,
            );
        });
    }
    lines.push('');

    // Other team issues
    lines.push('---');
    lines.push('');
    lines.push('## 4. Other Team Issues');
    lines.push('');
    lines.push(
        'Issues **not** categorised as Growth (Suite-Wallet, Suite-Trade, Suite-Foundation, etc.).',
    );
    lines.push('');

    if (result.otherIssues.length === 0) {
        lines.push('_No other issues found._');
    } else {
        lines.push('| Issue | Labels | Last updated |');
        lines.push('|---|---|---|');
        result.otherIssues.forEach(issue => {
            const labelStr = issue.labels.map(l => `\`${l.name}\``).join(' ') || '—';
            lines.push(
                `| ${issueLink(issue)} | ${labelStr} | ${formatDate(issue.updated_at)} |`,
            );
        });
    }
    lines.push('');

    return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    const args = process.argv.slice(2);
    const outputIdx = args.indexOf('--output');
    const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : undefined;
    const jsonMode = args.includes('--json');

    console.error(`Fetching open issues from ${REPO_OWNER}/${REPO_NAME}…`);
    const issues = await fetchAllIssues();
    console.error(`Fetched ${issues.length} open issues.`);

    console.error('Analysing for duplicates…');
    const duplicateGroups = findDuplicates(issues);
    console.error(`Found ${duplicateGroups.length} potential duplicate group(s).`);

    console.error('Analysing for possibly-completed issues…');
    const possiblyCompleted = findPossiblyCompleted(issues);
    console.error(`Found ${possiblyCompleted.length} possibly-completed issue(s).`);

    console.error('Categorising issues by team…');
    const { growthIssues, otherIssues } = issues.reduce<{
        growthIssues: GithubIssue[];
        otherIssues: GithubIssue[];
    }>(
        (acc, issue) => {
            if (isGrowthIssue(issue)) {
                acc.growthIssues.push(issue);
            } else {
                acc.otherIssues.push(issue);
            }

            return acc;
        },
        { growthIssues: [], otherIssues: [] },
    );
    console.error(
        `Growth: ${growthIssues.length}, Other: ${otherIssues.length}`,
    );

    const result: AnalysisResult = {
        issues,
        duplicateGroups,
        possiblyCompleted,
        growthIssues,
        otherIssues,
    };

    if (jsonMode) {
        const json = JSON.stringify(result, null, 2);
        if (outputFile) {
            fs.writeFileSync(outputFile, json, 'utf8');
            console.error(`JSON written to ${outputFile}`);
        } else {
            process.stdout.write(json);
        }

        return;
    }

    const report = buildReport(result);

    if (outputFile) {
        fs.writeFileSync(outputFile, report, 'utf8');
        console.error(`Report written to ${outputFile}`);
    } else {
        process.stdout.write(report);
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
