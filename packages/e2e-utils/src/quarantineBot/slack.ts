/* eslint-disable no-console */

export function getSlackWebhook(): string | undefined {
    return process.env.E2E_TEST_SLACK_QUARANTINE_BOT_WEBHOOK;
}

export async function sendSlackNotification(message: string): Promise<void> {
    const webhook = getSlackWebhook();
    if (!webhook) {
        console.log(
            '[slack] No E2E_TEST_SLACK_QUARANTINE_BOT_WEBHOOK configured, skipping notification.',
        );
        console.log(`[slack] Message would have been:\n${message}`);

        return;
    }
    const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
    });
    if (!res.ok) {
        console.warn(`[slack] Failed to send Slack notification: ${res.status}`);
    }
}
