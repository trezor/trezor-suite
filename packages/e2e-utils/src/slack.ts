import { createLogger } from './logger';

const logger = createLogger('slack');

/**
 * Posts to a Slack incoming webhook. Best-effort: a missing webhook or a failed delivery is
 * logged, never thrown, so reporting can't fail the job it reports on. Slack is an external
 * sink — keep secrets and account data out of `text`.
 */
export const postSlackMessage = async (
    webhook: string | undefined,
    text: string,
): Promise<void> => {
    if (!webhook) {
        logger.log(`No Slack webhook configured, skipping. Message would have been:\n${text}`);

        return;
    }

    logger.debug(`Sending notification (${text.length} chars) to webhook`);

    try {
        const response = await fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });

        if (response.ok) {
            logger.debug('Notification sent.');
        } else {
            logger.warn(`Failed to send Slack notification: ${response.status}`);
        }
    } catch (err) {
        logger.warn(
            `Failed to send Slack notification: ${err instanceof Error ? err.message : String(err)}`,
        );
    }
};

/** Link to the current GitHub Actions run, or undefined when not running in CI. */
export const githubRunUrl = (): string | undefined => {
    const runId = process.env.GITHUB_RUN_ID;
    if (!runId) return undefined;

    const repo = process.env.GITHUB_REPOSITORY ?? 'trezor/trezor-suite';
    const server = process.env.GITHUB_SERVER_URL ?? 'https://github.com';
    const attempt = process.env.GITHUB_RUN_ATTEMPT;
    const base = `${server}/${repo}/actions/runs/${runId}`;

    // Re-runs keep the same run id, so link the attempt that actually produced the failure.
    return attempt !== undefined && attempt !== '1' ? `${base}/attempts/${attempt}` : base;
};

/** The run URL wrapped in Slack's link syntax. */
export const githubRunLink = (label = 'CI run'): string | undefined => {
    const url = githubRunUrl();

    return url === undefined ? undefined : `<${url}|${label}>`;
};
