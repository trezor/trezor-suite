import { createRequire } from 'node:module';

const require = createRequire(__filename);

const { businessDaysSince, getQaStatusName, hasUnansweredQaMention, timelineEventsFromNode } =
    require('./stale-qa-monitor.cjs') as {
        businessDaysSince: (dateStr: string, now: Date) => number;
        getQaStatusName: (status: {
            id?: string;
            optionId?: string;
            name?: string;
        }) => string | null;
        hasUnansweredQaMention: (
            events: Array<{
                body?: string;
                createdAt?: string;
                author?: { __typename?: string; type?: string; login?: string } | null;
            }>,
        ) => boolean;
        timelineEventsFromNode: (node: {
            body?: string;
            createdAt?: string;
            submittedAt?: string;
            author?: { login?: string } | null;
            comments?: {
                nodes: Array<{
                    body?: string;
                    createdAt?: string;
                    author?: { __typename?: string; login?: string } | null;
                }>;
            };
        }) => Array<{ body: string; createdAt: string }>;
    };

const person = (login: string) => ({ __typename: 'User', login });
const bot = (login: string) => ({ __typename: 'Bot', login });

describe('getQaStatusName', () => {
    it('recognizes the Suite project QA statuses', () => {
        expect(getQaStatusName({ optionId: '97926e6f', name: '🤝 Needs QA' })).toBe('🤝 Needs QA');
        expect(getQaStatusName({ id: '93108e06', name: '🧪 QA In progress' })).toBe(
            '🧪 QA In progress',
        );
        expect(getQaStatusName({ name: 'Needs QA' })).toBe('Needs QA');
        expect(getQaStatusName({ name: 'QA in progress' })).toBe('QA in progress');
    });

    it('ignores other project statuses', () => {
        expect(getQaStatusName({ optionId: '0f23d421', name: '✅ Approved' })).toBeNull();
        expect(getQaStatusName({ name: 'In progress' })).toBeNull();
        expect(getQaStatusName({})).toBeNull();
    });
});

describe('hasUnansweredQaMention', () => {
    it('is true when the latest QA mention has no later human reply', () => {
        expect(
            hasUnansweredQaMention([
                {
                    body: 'Please take a look @trezor/qa',
                    createdAt: '2026-11-10T10:00:00Z',
                    author: person('dev'),
                },
                {
                    body: 'Reminder queued',
                    createdAt: '2026-11-10T10:05:00Z',
                    author: bot('trezor-bot[bot]'),
                },
            ]),
        ).toBe(true);
    });

    it('is false when someone replies after the mention', () => {
        expect(
            hasUnansweredQaMention([
                {
                    body: '@trezor/qa could you please try to reproduce?',
                    createdAt: '2026-08-05T15:35:11Z',
                    author: person('matejkriz'),
                },
                {
                    body: 'There is a timer that keeps growing.',
                    createdAt: '2026-08-06T11:26:35Z',
                    author: person('mroz22'),
                },
            ]),
        ).toBe(false);
    });

    it('follows the latest mention when QA is tagged again', () => {
        expect(
            hasUnansweredQaMention([
                {
                    body: '@trezor/qa first ping',
                    createdAt: '2026-11-01T10:00:00Z',
                    author: person('dev'),
                },
                {
                    body: 'Looking now',
                    createdAt: '2026-11-02T10:00:00Z',
                    author: person('qa'),
                },
                {
                    body: 'One more check @Trezor/QA',
                    createdAt: '2026-11-12T10:00:00Z',
                    author: person('dev'),
                },
            ]),
        ).toBe(true);
    });

    it('reads inline review threads as separate comments', () => {
        const events = timelineEventsFromNode({
            comments: {
                nodes: [
                    {
                        body: '@trezor/qa please check this line',
                        createdAt: '2026-11-10T10:00:00Z',
                        author: person('dev'),
                    },
                    {
                        body: 'Checked',
                        createdAt: '2026-11-10T12:00:00Z',
                        author: person('qa'),
                    },
                ],
            },
        });

        expect(events).toHaveLength(2);
        expect(hasUnansweredQaMention(events)).toBe(false);
    });

    it('is false when the team was not mentioned', () => {
        expect(
            hasUnansweredQaMention([
                {
                    body: 'No team mention here',
                    createdAt: '2026-11-10T10:00:00Z',
                    author: person('dev'),
                },
            ]),
        ).toBe(false);
    });
});

describe('businessDaysSince', () => {
    const now = new Date('2026-11-17T15:00:00Z');

    it('skips weekends', () => {
        expect(businessDaysSince('2026-11-13T23:00:00Z', now)).toBe(2);
        expect(businessDaysSince('2026-11-16T09:00:00Z', now)).toBe(1);
        expect(businessDaysSince('2026-11-17T08:00:00Z', now)).toBe(0);
    });
});
