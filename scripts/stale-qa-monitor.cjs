// Status names on the Suite project include emoji, so comparisons use the option
// id or the name with emoji and extra space removed.

const QA_STATUS_OPTION_IDS = new Set(['97926e6f', '93108e06']);

const QA_STATUS_NAMES = new Set(['needs qa', 'qa in progress']);

const QA_STATUS_FALLBACK_NAMES = {
    '97926e6f': 'Needs QA',
    '93108e06': 'QA In progress',
};

const QA_TEAM_MENTION = /@trezor\/qa\b/i;

const normalizeStatusName = name =>
    name
        .replace(/\p{Extended_Pictographic}/gu, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

const getQaStatusName = status => {
    const optionId = status?.optionId ?? status?.id;
    const name = typeof status?.name === 'string' ? status.name.trim() : '';

    if (optionId && QA_STATUS_OPTION_IDS.has(optionId)) {
        return name || QA_STATUS_FALLBACK_NAMES[optionId];
    }

    if (!name || !QA_STATUS_NAMES.has(normalizeStatusName(name))) {
        return null;
    }

    return name;
};

const mentionsQaTeam = body => QA_TEAM_MENTION.test(body ?? '');

const isBotAuthor = author => {
    if (!author) {
        return false;
    }

    if (author.__typename === 'Bot' || author.type === 'Bot') {
        return true;
    }

    return typeof author.login === 'string' && author.login.endsWith('[bot]');
};

// A bot reply does not answer a QA ping. Only a later comment from a person does.
const hasUnansweredQaMention = events => {
    const datedEvents = events
        .filter(event => event?.createdAt)
        .sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt));

    let latestMentionIndex = -1;

    for (let index = 0; index < datedEvents.length; index += 1) {
        if (mentionsQaTeam(datedEvents[index].body)) {
            latestMentionIndex = index;
        }
    }

    if (latestMentionIndex === -1) {
        return false;
    }

    for (let index = latestMentionIndex + 1; index < datedEvents.length; index += 1) {
        if (!isBotAuthor(datedEvents[index].author)) {
            return false;
        }
    }

    return true;
};

const getStartOfUTCDay = date =>
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const businessDaysSince = (dateStr, now) => {
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

const toTimelineEvent = node => {
    if (!node) {
        return null;
    }

    const createdAt = node.createdAt ?? node.submittedAt;

    if (!createdAt) {
        return null;
    }

    return {
        body: node.body ?? '',
        createdAt,
        author: node.author ?? null,
    };
};

const timelineEventsFromNode = node => {
    const threadComments = node?.comments?.nodes;

    if (Array.isArray(threadComments)) {
        return threadComments.map(toTimelineEvent).filter(Boolean);
    }

    const event = toTimelineEvent(node);

    return event ? [event] : [];
};

module.exports = {
    businessDaysSince,
    getQaStatusName,
    hasUnansweredQaMention,
    timelineEventsFromNode,
};
