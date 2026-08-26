import { execFileSync } from 'node:child_process';

import { error, log } from '../logger';
import { CONTEXT_FILE, writeJson } from './paths';
import { DeviceModelSchema, type PrContext } from './schemas';
import { parsePrNumber } from './target';

const REPO = 'trezor/trezor-suite';
const PREVIEW_SUITE_URL_BASE = 'https://dev.suite.sldev.cz/suite-web';
const DEFAULT_MODEL = 'T3W1';
const MAX_BODY_CHARS = 4000;

type PullRequest = {
    number: number;
    title: string;
    body: string;
    headRefName: string;
    url: string;
    closingIssueNumbers: number[];
};

type Issue = {
    number: number;
    title: string;
    body: string;
    url: string;
};

function loadPullRequest(prNumber: number): PullRequest {
    const data: {
        number: number;
        title: string;
        body: string;
        headRefName: string;
        url: string;
        closingIssuesReferences: { number: number }[];
    } = JSON.parse(
        execFileSync(
            'gh',
            [
                'pr',
                'view',
                String(prNumber),
                '--repo',
                REPO,
                '--json',
                'number,title,body,headRefName,url,closingIssuesReferences',
            ],
            { encoding: 'utf-8', maxBuffer: 16 * 1024 * 1024 },
        ),
    );

    return {
        number: data.number,
        title: data.title,
        body: data.body,
        headRefName: data.headRefName,
        url: data.url,
        closingIssueNumbers: data.closingIssuesReferences.map(({ number }) => number),
    };
}

function loadIssue(issueNumber: number): Issue {
    const data: {
        number: number;
        title: string;
        body: string;
        url: string;
    } = JSON.parse(
        execFileSync(
            'gh',
            [
                'issue',
                'view',
                String(issueNumber),
                '--repo',
                REPO,
                '--json',
                'number,title,body,url',
            ],
            { encoding: 'utf-8', maxBuffer: 16 * 1024 * 1024 },
        ),
    );

    return data;
}

// The PR's first closing issue (if any) provides the bug/feature context.
function loadClosingIssue(pr: PullRequest): Issue | null {
    const [firstClosing, ...rest] = pr.closingIssueNumbers;
    if (firstClosing === undefined) {
        return null;
    }

    const issue = loadIssue(firstClosing);
    log(
        rest.length > 0
            ? `[context] PR #${pr.number}: ${pr.closingIssueNumbers.length} closing issues — using #${issue.number}`
            : `[context] PR #${pr.number} → issue #${issue.number} ${issue.title}`,
    );

    return issue;
}

// Bot-managed sections nest (DETAILS wrapping SELECTOR, …). Strip innermost
// <!-- NAME:START -->…<!-- NAME:END --> pairs until none remain, then truncate.
function stripBotSections(body: string | undefined): string {
    const innermost =
        /<!--\s*([\w:-]+):START\s*-->(?:(?!<!--\s*[\w:-]+:(?:START|END)\s*-->)[\s\S])*?<!--\s*\1:END\s*-->/gi;
    let stripped = body ?? '';

    for (;;) {
        const next = stripped.replace(innermost, '');
        if (next === stripped) {
            break;
        }
        stripped = next;
    }

    return stripped.trim().slice(0, MAX_BODY_CHARS);
}

function main(): void {
    const prNumber = parsePrNumber(process.env.TARGET);
    const deviceModel = DeviceModelSchema.parse(process.env.DEVICE_MODEL ?? DEFAULT_MODEL);

    const pr = loadPullRequest(prNumber);
    const issue = loadClosingIssue(pr);
    const suiteUrl = `${PREVIEW_SUITE_URL_BASE}/${pr.headRefName}/web/`;

    const context: PrContext = {
        prNumber: pr.number,
        prUrl: pr.url,
        prTitle: pr.title,
        prBody: stripBotSections(pr.body),
        issue: issue && {
            number: issue.number,
            title: issue.title,
            body: stripBotSections(issue.body),
            url: issue.url,
        },
        deviceModel,
        suiteUrl,
    };

    writeJson(CONTEXT_FILE, context);
    log(`PR #${context.prNumber}: ${context.prTitle}`);
    log(`Suite URL: ${context.suiteUrl}`);
    log(`Device model: ${context.deviceModel}`);
}

try {
    main();
} catch (e) {
    error(`context failed: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
}
