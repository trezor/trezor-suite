/* eslint-disable no-console */
import { SLACK_TITLE_MAX_LENGTH } from './config';
import type { SlackEvent } from './types';

export function getSlackWebhook(): string | undefined {
    return process.env.E2E_TEST_SLACK_QUARANTINE_BOT_WEBHOOK;
}

function truncateTitle(titlePath: string[]): string {
    const joined = titlePath.join(' > ');

    return joined.length > SLACK_TITLE_MAX_LENGTH
        ? `${joined.slice(0, SLACK_TITLE_MAX_LENGTH)}…`
        : joined;
}

function currentsTestUrl(projectId: string, signature: string): string {
    return `https://app.currents.dev/projects/${projectId}/insights/tests/${signature}`;
}

function currentsActionUrl(projectId: string, actionId: string): string {
    return `https://app.currents.dev/projects/${projectId}/actions/${actionId}`;
}

/**
 * Build a single batched Slack message summarising all quarantine/unquarantine
 * events across all projects. Returns null if there is nothing to report.
 *
 * *Trezor Suite (web)*
 * :warning: *Quarantined (2)*
 * • Staking - Cardano > Stake Cardano — 3/5 fail · action · currents
 * • Dashboard > Send flow > Send BTC — 2/5 fail · action · currents
 * :white_check_mark: *Restored (1)*
 * • Settings > Change passphrase — 25/25 pass · currents
 *
 * *Trezor Suite (desktop)*
 * :warning: *Quarantined (1)*
 * • Onboarding > Create new wallet — 4/5 fail · action · currents
 *
 * CI run
 */
export function buildSlackSummary(
    projects: Array<{ id: string; label: string }>,
    events: SlackEvent[],
    options: { headerNote?: string } = {},
): string | null {
    if (events.length === 0) {
        return null;
    }

    const sections: string[] = [];

    if (options.headerNote) {
        sections.push(`:information_source: ${options.headerNote}`);
    }

    for (const { id: projectId, label: projectLabel } of projects) {
        const projectEvents = events.filter(e => e.projectId === projectId);
        if (projectEvents.length === 0) {
            continue;
        }

        const quarantinedEvents = projectEvents.filter(e => e.kind === 'quarantined');
        const unquarantinedEvents = projectEvents.filter(e => e.kind === 'unquarantined');

        const lines: string[] = [`*${projectLabel}*`];

        if (quarantinedEvents.length > 0) {
            lines.push(`:warning: *Quarantined (${quarantinedEvents.length})*`);
            for (const event of quarantinedEvents) {
                const actionUrl = currentsActionUrl(projectId, event.actionId);
                const testLink = event.signature
                    ? ` · <${currentsTestUrl(projectId, event.signature)}|results>`
                    : '';
                lines.push(
                    `• ${truncateTitle(event.titlePath)} — ${event.failures}/${event.executions} failed · <${actionUrl}|action>${testLink}`,
                );
            }
        }

        if (unquarantinedEvents.length > 0) {
            lines.push(`:white_check_mark: *Restored (${unquarantinedEvents.length})*`);
            for (const event of unquarantinedEvents) {
                const resultsLink = event.signature
                    ? ` · <${currentsTestUrl(projectId, event.signature)}|results>`
                    : '';
                lines.push(
                    `• ${truncateTitle(event.titlePath)} — ${event.passes}/${event.executions} passed${resultsLink}`,
                );
            }
        }

        sections.push(lines.join('\n'));
    }

    if (sections.length === 0) {
        return null;
    }

    const ciRunUrl = `https://github.com/trezor/trezor-suite/actions/runs/${process.env.GITHUB_RUN_ID}`;
    const footer = `<${ciRunUrl}|CI run>`;

    return [...sections, footer].join('\n\n');
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
