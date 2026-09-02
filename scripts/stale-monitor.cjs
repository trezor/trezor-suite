// ./scripts/stale-monitor.js
// Checks for PRs and issues with no activity or label changes in STALE_DAYS
// and posts a Slack notification summarizing them.

module.exports = async ({ github, context, core }) => {
    const {
        STALE_DAYS: staleDaysEnv = '2',
        SLACK_WEBHOOK_STALE_REMINDER,
        TARGET_OWNER,
        TARGET_REPO,
    } = process.env;
    const { owner: contextOwner, repo: contextRepo } = context.repo;
    const STALE_DAYS = parseInt(staleDaysEnv, 10);
    const owner = TARGET_OWNER || contextOwner;
    const repo = TARGET_REPO || contextRepo;
    const now = new Date();

    if (!SLACK_WEBHOOK_STALE_REMINDER) {
        core.setFailed('SLACK_WEBHOOK_STALE_REMINDER secret is not set.');

        return;
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    const getStartOfUTCDay = date =>
        new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

    const businessDaysSince = dateStr => {
        const updatedDate = getStartOfUTCDay(new Date(dateStr));
        const currentDate = getStartOfUTCDay(now);
        const iteratedDate = new Date(updatedDate);
        let businessDays = 0;

        while (iteratedDate < currentDate) {
            iteratedDate.setUTCDate(iteratedDate.getUTCDate() + 1);

            const dayOfWeek = iteratedDate.getUTCDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            if (!isWeekend) {
                businessDays += 1;
            }
        }

        return businessDays;
    };

    const isStale = item => businessDaysSince(item.updated_at) >= STALE_DAYS;

    const labelNames = item => item.labels.map(l => l.name).join(', ') || '_no labels_';

    const assigneeNames = item => item.assignees?.map(a => a.login).join(', ') || '_unassigned_';

    // ─── Fetch open PRs ─────────────────────────────────────────────────────────

    let allPRs;
    try {
        allPRs = await github.paginate(github.rest.pulls.list, {
            owner,
            repo,
            state: 'open',
            per_page: 100,
        });
    } catch (error) {
        core.setFailed(`Failed to fetch open PRs from ${owner}/${repo}: ${error.message}`);

        return;
    }

    const stalePRs = allPRs.filter(isStale);

    // ─── Fetch open Issues ──────────────────────────────────────────────────────
    // GitHub Issues API also returns PRs, so we filter them out by checking
    // for the absence of a pull_request field.

    let allIssues;
    try {
        allIssues = await github.paginate(github.rest.issues.listForRepo, {
            owner,
            repo,
            state: 'open',
            per_page: 100,
            filter: 'all',
        });
    } catch (error) {
        core.setFailed(`Failed to fetch open issues from ${owner}/${repo}: ${error.message}`);

        return;
    }

    const staleIssues = allIssues
        .filter(i => !i.pull_request) // exclude PRs
        .filter(isStale);

    // ─── Build Slack message ────────────────────────────────────────────────────

    const repoLink = `https://github.com/${owner}/${repo}`;

    const formatPR = pr => {
        const days = businessDaysSince(pr.updated_at);

        return (
            `• *<${pr.html_url}|#${pr.number} ${pr.title}>*\n` +
            `  └ Idle for *${days} business day(s)* · Labels: ${labelNames(pr)} · Assignees: ${assigneeNames(pr)}`
        );
    };

    const formatIssue = issue => {
        const days = businessDaysSince(issue.updated_at);

        return (
            `• *<${issue.html_url}|#${issue.number} ${issue.title}>*\n` +
            `  └ Idle for *${days} business day(s)* · Labels: ${labelNames(issue)} · Assignees: ${assigneeNames(issue)}`
        );
    };

    // Slack `section.text` is capped at 3000 chars and a message at 50 blocks.
    // Use safety margins to avoid silent webhook failures on long lists.
    const SECTION_TEXT_LIMIT = 2900;
    const PER_CATEGORY_BLOCK_BUDGET = 20;

    const buildChunkedSections = (headerLine, formattedItems) => {
        const sections = [];
        let buffer = headerLine;
        let renderedCount = 0;

        const flushBuffer = () => {
            if (buffer.length === 0) {
                return;
            }
            sections.push({
                type: 'section',
                text: { type: 'mrkdwn', text: buffer },
            });
            buffer = '';
        };

        for (const item of formattedItems) {
            const separator = buffer.length > 0 ? '\n\n' : '';
            const candidate = buffer + separator + item;

            if (candidate.length <= SECTION_TEXT_LIMIT) {
                buffer = candidate;
                renderedCount += 1;
                continue;
            }

            // Current buffer is full; only start a new section if budget allows.
            if (sections.length + 1 >= PER_CATEGORY_BLOCK_BUDGET) {
                break;
            }

            flushBuffer();
            buffer =
                item.length > SECTION_TEXT_LIMIT
                    ? `${item.slice(0, SECTION_TEXT_LIMIT - 1)}…`
                    : item;
            renderedCount += 1;
        }

        const omittedCount = formattedItems.length - renderedCount;
        if (omittedCount > 0) {
            const note = `\n\n_…and ${omittedCount} more not shown._`;
            if (buffer.length + note.length > SECTION_TEXT_LIMIT) {
                buffer = `${buffer.slice(0, SECTION_TEXT_LIMIT - note.length - 1)}…${note}`;
            } else {
                buffer += note;
            }
        }

        flushBuffer();

        return sections;
    };

    const blocks = [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text: `🔔 Stale Monitor — ${owner}/${repo}`,
                emoji: true,
            },
        },
        {
            type: 'context',
            elements: [
                {
                    type: 'mrkdwn',
                    text: `Items with *no activity for ${STALE_DAYS}+ business day(s)* as of <!date^${Math.floor(now / 1000)}^{date_short}|today>`,
                },
            ],
        },
        { type: 'divider' },
    ];

    // Pull Requests section
    if (stalePRs.length > 0) {
        blocks.push(
            ...buildChunkedSections(
                `*📋 Stale Pull Requests (${stalePRs.length})*`,
                stalePRs.map(formatPR),
            ),
        );
    } else {
        blocks.push({
            type: 'section',
            text: { type: 'mrkdwn', text: '*📋 Pull Requests* — ✅ No stale PRs!' },
        });
    }

    blocks.push({ type: 'divider' });

    // Issues section
    if (staleIssues.length > 0) {
        blocks.push(
            ...buildChunkedSections(
                `*🐛 Stale Issues (${staleIssues.length})*`,
                staleIssues.map(formatIssue),
            ),
        );
    } else {
        blocks.push({
            type: 'section',
            text: { type: 'mrkdwn', text: '*🐛 Issues* — ✅ No stale issues!' },
        });
    }

    blocks.push({
        type: 'context',
        elements: [
            {
                type: 'mrkdwn',
                text: `<${repoLink}|View repository> · Threshold: ${STALE_DAYS} business day(s)`,
            },
        ],
    });

    // ─── Post to Slack ───────────────────────────────────────────────────────────

    const payload = { blocks };

    let response;
    try {
        response = await fetch(SLACK_WEBHOOK_STALE_REMINDER, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    } catch (error) {
        core.setFailed(`Slack webhook request failed: ${error.message}`);

        return;
    }

    if (!response.ok) {
        const text = await response.text();
        core.setFailed(`Slack webhook failed: ${response.status} — ${text}`);

        return;
    }

    core.info(
        `✅ Slack notified. Stale PRs: ${stalePRs.length}, Stale Issues: ${staleIssues.length}`,
    );
};
