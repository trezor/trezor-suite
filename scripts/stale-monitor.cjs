// Posts a Slack summary of QA work idle for STALE_DAYS business days. Needs QA and
// QA In progress are usually applied on merge or close, so closed items are included.

const {
    businessDaysSince,
    getQaStatusName,
    hasUnansweredQaMention,
    timelineEventsFromNode,
} = require('./stale-qa-monitor.cjs');

const DEFAULT_PROJECT_ID = 'PVT_kwDOAD9FD84AAuwj';
const TIMELINE_BATCH_SIZE = 20;
const SEARCH_PAGE_SIZE = 100;
const MAX_SEARCH_PAGES = 10;

const STATUS_FIELD_QUERY = `
    query($projectId: ID!) {
        node(id: $projectId) {
            ... on ProjectV2 {
                field(name: "Status") {
                    ... on ProjectV2SingleSelectField {
                        options { id name }
                    }
                }
            }
        }
    }
`;

const PROJECT_ITEMS_QUERY = `
    query($projectId: ID!, $search: String!, $after: String) {
        node(id: $projectId) {
            ... on ProjectV2 {
                items(first: 50, after: $after, query: $search) {
                    pageInfo { hasNextPage endCursor }
                    nodes {
                        status: fieldValueByName(name: "Status") {
                            ... on ProjectV2ItemFieldSingleSelectValue { name optionId }
                        }
                        content {
                            __typename
                            ... on Issue {
                                number
                                title
                                url
                                state
                                updatedAt
                                repository { nameWithOwner }
                                labels(first: 50) { nodes { name } }
                                assignees(first: 20) { nodes { login } }
                            }
                            ... on PullRequest {
                                number
                                title
                                url
                                state
                                updatedAt
                                repository { nameWithOwner }
                                labels(first: 50) { nodes { name } }
                                assignees(first: 20) { nodes { login } }
                            }
                        }
                    }
                }
            }
        }
    }
`;

module.exports = async ({ github, context, core }) => {
    const {
        STALE_DAYS: staleDaysEnv = '2',
        SLACK_WEBHOOK_STALE_REMINDER,
        TARGET_OWNER,
        TARGET_REPO,
        PROJECT_ID: projectIdEnv = DEFAULT_PROJECT_ID,
    } = process.env;
    const { owner: contextOwner, repo: contextRepo } = context.repo;
    const STALE_DAYS = parseInt(staleDaysEnv, 10);
    const owner = TARGET_OWNER || contextOwner;
    const repo = TARGET_REPO || contextRepo;
    const projectId = projectIdEnv;
    const now = new Date();
    const repoName = `${owner}/${repo}`.toLowerCase();

    if (!SLACK_WEBHOOK_STALE_REMINDER) {
        core.setFailed('SLACK_WEBHOOK_STALE_REMINDER secret is not set.');

        return;
    }

    if (!Number.isInteger(STALE_DAYS) || STALE_DAYS < 1) {
        core.setFailed(`STALE_DAYS must be a positive integer. Received "${staleDaysEnv}".`);

        return;
    }

    const isStale = item => businessDaysSince(item.updatedAt, now) >= STALE_DAYS;

    const labelNames = item => item.labels.map(label => label.name).join(', ') || '_no labels_';

    const assigneeNames = item =>
        item.assignees?.map(assignee => assignee.login).join(', ') || '_unassigned_';

    const escapeProjectQueryValue = value => value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');

    const rememberItem = (itemsByNumber, item) => {
        const existing = itemsByNumber.get(item.number);

        if (!existing) {
            itemsByNumber.set(item.number, item);

            return;
        }

        const reasons = [...new Set([...existing.reasons, ...item.reasons])];
        itemsByNumber.set(item.number, { ...existing, reasons });
    };

    const toTrackedItem = (content, reason) => ({
        number: content.number,
        title: content.title,
        htmlUrl: content.url,
        updatedAt: content.updatedAt,
        state: content.state.toLowerCase(),
        isPullRequest: content.__typename === 'PullRequest',
        labels: (content.labels?.nodes ?? []).map(label => ({ name: label.name })),
        assignees: (content.assignees?.nodes ?? []).map(assignee => ({ login: assignee.login })),
        reasons: [reason],
    });

    const fetchQaStatusOptions = async () => {
        const data = await github.graphql(STATUS_FIELD_QUERY, { projectId });
        const options = data?.node?.field?.options;

        if (!options) {
            throw new Error(`Project ${projectId} has no Status single-select field.`);
        }

        return options.filter(option => getQaStatusName(option));
    };

    const fetchProjectItems = async statusName => {
        const items = [];
        let after = null;
        let hasNextPage = true;
        const search = `status:"${escapeProjectQueryValue(statusName)}" repo:${owner}/${repo}`;

        while (hasNextPage) {
            const data = await github.graphql(PROJECT_ITEMS_QUERY, {
                projectId,
                search,
                after,
            });
            const connection = data?.node?.items;

            if (!connection) {
                throw new Error(`Project ${projectId} could not be read.`);
            }

            items.push(...connection.nodes.filter(Boolean));
            const nextCursor = connection.pageInfo.endCursor;
            hasNextPage = connection.pageInfo.hasNextPage && nextCursor && nextCursor !== after;
            after = nextCursor;
        }

        return items;
    };

    const searchQaMentions = async () => {
        const items = [];
        let totalCount = 0;

        for (let page = 1; page <= MAX_SEARCH_PAGES; page += 1) {
            const response = await github.request('GET /search/issues', {
                q: `repo:${owner}/${repo} "@trezor/qa" in:comments`,
                advanced_search: 'true',
                per_page: SEARCH_PAGE_SIZE,
                page,
            });
            const pageItems = response.data.items ?? [];
            totalCount = response.data.total_count ?? items.length + pageItems.length;
            items.push(...pageItems);

            if (pageItems.length === 0 || items.length >= totalCount) {
                break;
            }
        }

        if (totalCount > items.length) {
            core.warning(
                `Search returned ${items.length} of ${totalCount} @trezor/qa mentions. Some items were not checked.`,
            );
        }

        return items;
    };

    const buildTimelineQuery = batch => {
        const selections = batch.map(item => {
            const field = item.isPullRequest ? 'pullRequest' : 'issue';
            const itemTypes = item.isPullRequest
                ? '[ISSUE_COMMENT, PULL_REQUEST_REVIEW, PULL_REQUEST_REVIEW_THREAD]'
                : '[ISSUE_COMMENT]';
            const reviewFragments = item.isPullRequest
                ? `
                ... on PullRequestReview { body submittedAt author { __typename login } }
                ... on PullRequestReviewThread {
                    comments(last: 20) { nodes { body createdAt author { __typename login } } }
                }`
                : '';

            return `
                item${item.number}: ${field}(number: ${item.number}) {
                    timelineItems(last: 100, itemTypes: ${itemTypes}) {
                        nodes {
                            __typename
                            ... on IssueComment { body createdAt author { __typename login } }
                            ${reviewFragments}
                        }
                    }
                }
            `;
        });

        return `
            query($owner: String!, $repo: String!) {
                repository(owner: $owner, name: $repo) {
                    ${selections.join('\n')}
                }
            }
        `;
    };

    const fetchTimelines = async candidates => {
        const eventsByNumber = new Map();

        for (let index = 0; index < candidates.length; index += TIMELINE_BATCH_SIZE) {
            const batch = candidates.slice(index, index + TIMELINE_BATCH_SIZE);
            const data = await github.graphql(buildTimelineQuery(batch), { owner, repo });
            const repository = data.repository ?? {};

            for (const candidate of batch) {
                const timeline = repository[`item${candidate.number}`]?.timelineItems?.nodes ?? [];
                eventsByNumber.set(candidate.number, timeline.flatMap(timelineEventsFromNode));
            }
        }

        return eventsByNumber;
    };

    let qaOptions;
    try {
        qaOptions = await fetchQaStatusOptions();
    } catch (error) {
        core.setFailed(`Failed to read project status options: ${error.message}`);

        return;
    }

    if (qaOptions.length === 0) {
        core.setFailed(`Project ${projectId} has no Status option for Needs QA or QA In progress.`);

        return;
    }

    const itemsByNumber = new Map();

    try {
        for (const option of qaOptions) {
            const statusName = getQaStatusName(option);
            const nodes = await fetchProjectItems(option.name);

            for (const node of nodes) {
                const { content } = node;

                if (!content?.number || !Number.isInteger(content.number)) {
                    continue;
                }

                if (content.repository?.nameWithOwner?.toLowerCase() !== repoName) {
                    continue;
                }

                const confirmedStatus = getQaStatusName(node.status);

                if (!confirmedStatus) {
                    continue;
                }

                rememberItem(itemsByNumber, toTrackedItem(content, confirmedStatus));
            }

            core.info(`Project status "${statusName}" matched ${nodes.length} item(s).`);
        }
    } catch (error) {
        core.setFailed(`Failed to fetch QA project items from ${owner}/${repo}: ${error.message}`);

        return;
    }

    let mentionResults;
    try {
        mentionResults = await searchQaMentions();
    } catch (error) {
        core.setFailed(`Failed to search for @trezor/qa mentions: ${error.message}`);

        return;
    }

    const mentionCandidates = [];

    for (const result of mentionResults) {
        if (!Number.isInteger(result.number) || itemsByNumber.has(result.number)) {
            continue;
        }

        const candidate = {
            number: result.number,
            title: result.title,
            htmlUrl: result.html_url,
            updatedAt: result.updated_at,
            state: result.pull_request?.merged_at
                ? 'merged'
                : String(result.state ?? 'open').toLowerCase(),
            isPullRequest: Boolean(result.pull_request),
            labels: (result.labels ?? []).map(label => ({ name: label.name })),
            assignees: (result.assignees ?? []).map(assignee => ({ login: assignee.login })),
            reasons: ['Unanswered @trezor/qa'],
        };

        if (isStale(candidate)) {
            mentionCandidates.push(candidate);
        }
    }

    let timelines;
    try {
        timelines = await fetchTimelines(mentionCandidates);
    } catch (error) {
        core.setFailed(`Failed to read comments for @trezor/qa mentions: ${error.message}`);

        return;
    }

    for (const candidate of mentionCandidates) {
        const events = timelines.get(candidate.number) ?? [];

        if (hasUnansweredQaMention(events)) {
            rememberItem(itemsByNumber, candidate);
        }
    }

    const reportedItems = [...itemsByNumber.values()]
        .filter(isStale)
        .sort((left, right) => Date.parse(left.updatedAt) - Date.parse(right.updatedAt));
    const stalePRs = reportedItems.filter(item => item.isPullRequest);
    const staleIssues = reportedItems.filter(item => !item.isPullRequest);

    const repoLink = `https://github.com/${owner}/${repo}`;

    const formatItem = item => {
        const days = businessDaysSince(item.updatedAt, now);
        const state = item.state === 'open' ? '' : `${item.state} · `;

        return (
            `• *<${item.htmlUrl}|#${item.number} ${item.title}>*\n` +
            `  └ Idle for *${days} business day(s)* · ${state}${item.reasons.join(', ')} · Labels: ${labelNames(item)} · Assignees: ${assigneeNames(item)}`
        );
    };

    // Slack section.text is capped at 3000 chars and a message at 50 blocks.
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
                text: `🔔 QA stale monitor — ${owner}/${repo}`,
                emoji: true,
            },
        },
        {
            type: 'context',
            elements: [
                {
                    type: 'mrkdwn',
                    text:
                        `QA items with *no activity for ${STALE_DAYS}+ business day(s)* ` +
                        `(Needs QA, QA In progress, or an unanswered \`@trezor/qa\` mention) ` +
                        `as of <!date^${Math.floor(now / 1000)}^{date_short}|today>`,
                },
            ],
        },
        { type: 'divider' },
    ];

    if (stalePRs.length > 0) {
        blocks.push(
            ...buildChunkedSections(
                `*📋 Stale QA pull requests (${stalePRs.length})*`,
                stalePRs.map(formatItem),
            ),
        );
    } else {
        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: '*📋 Pull requests* — ✅ No stale QA pull requests',
            },
        });
    }

    blocks.push({ type: 'divider' });

    if (staleIssues.length > 0) {
        blocks.push(
            ...buildChunkedSections(
                `*🐛 Stale QA issues (${staleIssues.length})*`,
                staleIssues.map(formatItem),
            ),
        );
    } else {
        blocks.push({
            type: 'section',
            text: { type: 'mrkdwn', text: '*🐛 Issues* — ✅ No stale QA issues' },
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
        `✅ Slack notified. Stale QA PRs: ${stalePRs.length}, Stale QA issues: ${staleIssues.length}`,
    );
};
