#!/usr/bin/env node

// Selects one GitHub login for a monthly dependency issue and prints only that login to stdout.
// Required env: TEAM, YEAR_MONTH. Optional env: ASSIGNEE_TEAM_SLUG, ASSIGNEES.
// Prefer ASSIGNEE_TEAM_SLUG for live team membership; ASSIGNEES is a fallback list.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const REPO = 'trezor/trezor-suite';

const team = process.env.TEAM ?? '';
const yearMonth = process.env.YEAR_MONTH ?? '';
const assigneeTeamSlug = process.env.ASSIGNEE_TEAM_SLUG ?? '';
const fallbackAssignees = process.env.ASSIGNEES ?? '';

const runGh = (args, { allowFailure = false } = {}) => {
    const result = spawnSync('gh', args, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    result.stdout ??= '';
    result.stderr ??= result.error?.message ?? '';

    if (result.error && !allowFailure) {
        throw new Error(`Failed to run gh ${args.join(' ')}:\n${result.error.message}`);
    }

    if (result.status !== 0 && !allowFailure) {
        throw new Error(
            `gh ${args.join(' ')} failed with exit code ${result.status}:\n${result.stderr.trim()}`,
        );
    }

    return result;
};

const runGhJson = args => {
    const output = runGh(args).stdout.trim();

    return output ? JSON.parse(output) : [];
};

const parseLogins = value =>
    [...new Set(value.split(/[,\s]+/).map(login => login.replace(/^@/, '').trim()))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

const getFallbackAssignees = () => parseLogins(fallbackAssignees);

const getTeamMembers = () => {
    if (!assigneeTeamSlug) return [];

    const result = runGh(
        ['api', `orgs/trezor/teams/${assigneeTeamSlug}/members`, '--paginate', '--jq', '.[].login'],
        { allowFailure: true },
    );

    if (result.status !== 0) {
        console.warn(
            `Warning: Could not read team '${assigneeTeamSlug}', falling back to ASSIGNEES`,
        );
        if (result.stderr.trim()) console.warn(result.stderr.trim());

        return [];
    }

    const members = parseLogins(result.stdout);
    if (members.length === 0) {
        console.warn(`Warning: Team '${assigneeTeamSlug}' has no members, falling back to ASSIGNEES`);
    }

    return members;
};

const getCandidates = () => {
    const teamMembers = getTeamMembers();

    return teamMembers.length > 0 ? teamMembers : getFallbackAssignees();
};

const getMonthlyIssues = () =>
    runGhJson([
        'issue',
        'list',
        '--repo',
        REPO,
        '--search',
        `Bump ${team} deps in:title`,
        '--state',
        'all',
        '--limit',
        '1000',
        '--json',
        'assignees,createdAt,title',
    ]);

const getHashScore = value =>
    Number.parseInt(createHash('sha256').update(value).digest('hex').slice(0, 12), 16);

const selectAssignee = (candidates, monthlyIssues) => {
    const titlePrefix = `Bump ${team} deps (`;
    const relevantIssues = monthlyIssues.filter(issue => issue.title.startsWith(titlePrefix));
    const previousIssue = [...relevantIssues].sort(
        (left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt),
    ).at(-1);
    const previousAssignee = previousIssue?.assignees?.[0]?.login?.toLowerCase() ?? '';

    // Balance lifetime assignment count first, avoid immediate repeats second,
    // then use a deterministic month seed so reruns pick the same person.
    return candidates
        .map(login => {
            const normalizedLogin = login.toLowerCase();
            const count = relevantIssues.filter(issue =>
                issue.assignees?.some(assignee => assignee.login.toLowerCase() === normalizedLogin),
            ).length;

            return {
                login,
                count,
                repeatsPreviousAssignee:
                    previousAssignee !== '' && normalizedLogin === previousAssignee ? 1 : 0,
                score: getHashScore(`${yearMonth}:${team}:${login}`),
            };
        })
        .sort((left, right) => {
            if (left.count !== right.count) return left.count - right.count;
            if (left.repeatsPreviousAssignee !== right.repeatsPreviousAssignee) {
                return left.repeatsPreviousAssignee - right.repeatsPreviousAssignee;
            }

            return left.score - right.score;
        })[0]?.login;
};

const main = () => {
    if (!team) throw new Error('TEAM environment variable is required');
    if (!yearMonth) throw new Error('YEAR_MONTH environment variable is required');

    const candidates = getCandidates();
    if (candidates.length === 0) {
        console.warn('Warning: No assignee candidates found');

        return;
    }

    const assignee = selectAssignee(candidates, getMonthlyIssues());
    if (assignee) process.stdout.write(`${assignee}\n`);
};

try {
    main();
} catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
}
