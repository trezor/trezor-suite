import * as fs from 'node:fs';

type PullRequestEvent = { pull_request?: { number?: number }; number?: number };

export const resolvePullRequestNumber = (): number | null => {
    const eventPath = process.env.GITHUB_EVENT_PATH;
    if (!eventPath || !fs.existsSync(eventPath)) {
        return null;
    }

    try {
        const event = JSON.parse(fs.readFileSync(eventPath, 'utf8')) as PullRequestEvent;
        const number = event.pull_request?.number ?? event.number;

        return typeof number === 'number' ? number : null;
    } catch {
        return null;
    }
};

const resolveRepository = () => {
    const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? '').split('/');

    return owner && repo ? { owner, repo } : null;
};

export const resolveRunUrl = (): string | undefined => {
    const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_RUN_ATTEMPT } = process.env;
    if (!GITHUB_REPOSITORY || !GITHUB_RUN_ID) {
        return undefined;
    }

    const server = GITHUB_SERVER_URL ?? 'https://github.com';
    const run = `${server}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`;

    return GITHUB_RUN_ATTEMPT ? `${run}/attempts/${GITHUB_RUN_ATTEMPT}` : run;
};

type UpsertStickyPrComment = {
    marker: string;
    buildBody: (existingBody: string | undefined) => string;
    holdsOwnContent?: (body: string) => boolean;
    attempts?: number;
};

export type StickyPrCommentResult = 'created' | 'updated' | 'skipped';

export const upsertStickyPrComment = async ({
    marker,
    buildBody,
    holdsOwnContent,
    attempts = 3,
}: UpsertStickyPrComment): Promise<StickyPrCommentResult> => {
    const token = process.env.GITHUB_TOKEN;
    const repository = resolveRepository();
    const issueNumber = resolvePullRequestNumber();

    if (!token || !repository || issueNumber === null) {
        return 'skipped';
    }

    const { Octokit } = await import('@octokit/rest');
    const octokit = new Octokit({ auth: token });

    const findPrevious = async () => {
        const comments = await octokit.paginate(octokit.rest.issues.listComments, {
            ...repository,
            issue_number: issueNumber,
            per_page: 100,
        });

        return comments.find(comment => comment.body?.includes(marker));
    };

    let result: StickyPrCommentResult = 'skipped';

    for (let attempt = 0; attempt < attempts; attempt++) {
        const previous = await findPrevious();

        if (previous) {
            await octokit.rest.issues.updateComment({
                ...repository,
                comment_id: previous.id,
                body: buildBody(previous.body),
            });
            result = 'updated';
        } else {
            await octokit.rest.issues.createComment({
                ...repository,
                issue_number: issueNumber,
                body: buildBody(undefined),
            });
            result = 'created';
        }

        if (!holdsOwnContent) {
            return result;
        }

        const written = await findPrevious();
        if (written?.body && holdsOwnContent(written.body)) {
            return result;
        }
    }

    return result;
};
