import { error, log } from '../logger';
import { downloadAttachmentImages } from './contextImages';
import { CONTEXT_FILE, writeJson } from './paths';
import { DeviceModelSchema, type PrContext } from './schemas';
import { ghView, loadLinkedNumbersFrom, parseTarget } from './target';

const PREVIEW_SUITE_URL_BASE = 'https://dev.suite.sldev.cz/suite-web';
const DEFAULT_MODEL = 'T3W1';
const MAX_BODY_CHARS = 4000;

type PullRequest = {
    number: number;
    title: string;
    body: string;
    headRefName: string;
    url: string;
};

type GithubIssue = {
    number: number;
    title: string;
    body: string;
    url: string;
};

function loadPullRequest(prNumber: number): PullRequest {
    return ghView<PullRequest>('pr', prNumber, 'number,title,body,headRefName,url');
}

function loadIssue(issueNumber: number): GithubIssue {
    return ghView<GithubIssue>('issue', issueNumber, 'number,title,body,url');
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

function newestPr(prs: PullRequest[]): PullRequest {
    const [first] = prs;
    if (first === undefined) {
        throw new Error('no pull requests');
    }

    return prs.reduce((newest, pr) => (pr.number > newest.number ? pr : newest));
}

function toContextItem(item: GithubIssue | PullRequest) {
    return {
        number: item.number,
        title: item.title,
        body: stripBotSections(item.body),
        url: item.url,
    };
}

async function main(): Promise<void> {
    const target = parseTarget(process.env.TARGET);
    const deviceModel = DeviceModelSchema.parse(process.env.DEVICE_MODEL ?? DEFAULT_MODEL);

    let prs: PullRequest[];
    let issues: GithubIssue[];

    if (target.kind === 'pr') {
        prs = [loadPullRequest(target.number)];
        issues = loadLinkedNumbersFrom('pr', target.number).map(loadIssue);
    } else {
        prs = loadLinkedNumbersFrom('issue', target.number).map(loadPullRequest);
        if (prs.length === 0) {
            throw new Error(`issue #${target.number} has no linked pull request`);
        }
        issues = [loadIssue(target.number)];
    }

    const pr = newestPr(prs);
    const suiteUrl = `${PREVIEW_SUITE_URL_BASE}/${pr.headRefName}/web/`;
    const contextImages = await downloadAttachmentImages([
        ...prs.map(({ body }) => body),
        ...issues.map(({ body }) => body),
    ]);

    if (prs.length > 1) {
        log(
            `[context] PRs ${prs.map(({ number }) => `#${number}`).join(', ')} · Suite #${pr.number}`,
        );
    }

    const context: PrContext = {
        prNumber: pr.number,
        prUrl: pr.url,
        prTitle: pr.title,
        prBody: stripBotSections(pr.body),
        prs: prs.map(toContextItem),
        issues: issues.map(toContextItem),
        deviceModel,
        suiteUrl,
        contextImages,
    };

    writeJson(CONTEXT_FILE, context);
    log(`PR #${context.prNumber}: ${context.prTitle}`);
    log(`Suite URL: ${context.suiteUrl}`);
    log(`Device model: ${context.deviceModel}`);
    log(`Context images: ${context.contextImages.length}`);
}

main().catch(e => {
    error(`context failed: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
});
