import type { EventDoc } from '../types';
import {
    eventHasVersion,
    eventMatchesFullText,
    eventNameMatchesQuery,
    fuzzyMatch,
    fuzzyMatchExportName,
    getAllVersions,
    getEventId,
    getVersionsWithEvents,
    toEventExportName,
} from './filterUtils';

describe('fuzzyMatch (event name)', () => {
    it('empty query matches everything', () => {
        expect(fuzzyMatch('', 'accounts/active-staking')).toBe(true);
        expect(fuzzyMatch('   ', 'accounts/transactions-export')).toBe(true);
    });

    it('each token must match a whole segment (or prefix), not subsequence inside segment', () => {
        // "nacti" is subsequence of "transactions" – must NOT match
        expect(fuzzyMatch('accounts nacti', 'accounts/transactions-export')).toBe(false);
        expect(fuzzyMatch('accounts nacti', 'accounts/actions')).toBe(false);

        // "accounts" + "actions" as segments
        expect(fuzzyMatch('accounts actions', 'accounts/actions')).toBe(true);
        expect(fuzzyMatch('accounts action', 'accounts/actions')).toBe(true);
        expect(fuzzyMatch('accounts trans', 'accounts/transactions-export')).toBe(true);
    });

    it('matches event name by segment prefix or exact segment', () => {
        expect(fuzzyMatch('accounts', 'accounts/active-staking')).toBe(true);
        expect(fuzzyMatch('accounts active', 'accounts/active-staking')).toBe(true);
        expect(fuzzyMatch('active staking', 'accounts/active-staking')).toBe(true);
        expect(fuzzyMatch('accounts active staking', 'accounts/active-staking')).toBe(true);
    });

    it('does not match when token is not a segment and not prefix of a segment', () => {
        expect(fuzzyMatch('nacti', 'accounts/transactions-export')).toBe(false);
        expect(fuzzyMatch('transact', 'accounts/transactions-export')).toBe(true);
        expect(fuzzyMatch('export', 'accounts/transactions-export')).toBe(true);
    });

    it('splits event name by slash, underscore and hyphen', () => {
        expect(fuzzyMatch('accounts', 'accounts/something-else')).toBe(true);
        expect(fuzzyMatch('something else', 'accounts/something-else')).toBe(true);
    });

    it('full export name as one token does not match other events with same first segment', () => {
        // "accountsactivestakingevent" must not match "accounts/tokens-status" (first segment "accounts" was matching as prefix of token)
        expect(fuzzyMatch('accountsActiveStakingEvent', 'accounts/tokens-status')).toBe(false);
        expect(fuzzyMatch('accountsactivestakingevent', 'accounts/tokens-status')).toBe(false);
    });
});

describe('fuzzyMatchExportName', () => {
    it('empty query matches everything', () => {
        expect(fuzzyMatchExportName('', 'accountsActiveStakingEvent')).toBe(true);
    });

    it('"accountsactions" matches accounts/actions (accountsActionsEvent) but not accounts/transactions-export', () => {
        expect(fuzzyMatchExportName('accountsactions', 'accountsActionsEvent')).toBe(true);
        expect(fuzzyMatchExportName('accountsactions', 'accountsTransactionsExportEvent')).toBe(
            false,
        );
    });

    it('"accountsActiveStakin" matches accounts/active-staking (prefix of accountsactivestaking)', () => {
        expect(fuzzyMatchExportName('accountsActiveStakin', 'accountsActiveStakingEvent')).toBe(
            true,
        );
    });

    it('exact concatenation of consecutive words matches', () => {
        expect(fuzzyMatchExportName('accountsactivestaking', 'accountsActiveStakingEvent')).toBe(
            true,
        );
    });

    it('multiple tokens each must match contiguous words', () => {
        expect(fuzzyMatchExportName('accounts active', 'accountsActiveStakingEvent')).toBe(true);
        expect(fuzzyMatchExportName('accounts staking', 'accountsActiveStakingEvent')).toBe(true);
    });
});

const searchEvent = {
    name: 'accounts/active-staking',
    description: 'Tracks staking activity.',
    descriptionTrigger: 'Fires when the user opens the staking dashboard.',
    changelog: { entries: [] },
    attributes: {
        symbol: { description: 'Network symbol', changelog: { entries: [] } },
        stakeAmount: { description: 'Amount staked in base units', changelog: { entries: [] } },
        provider: {
            description: 'Backup provider',
            runtimeType: "'legacy'\n| 'dropbox'\n| 'suite-sync'",
            changelog: { entries: [] },
        },
    },
    platform: 'desktop',
} as unknown as EventDoc;

describe('eventNameMatchesQuery (simplified / titles only)', () => {
    it('empty query matches everything', () => {
        expect(eventNameMatchesQuery('', searchEvent)).toBe(true);
        expect(eventNameMatchesQuery('   ', searchEvent)).toBe(true);
    });

    it('matches by event name', () => {
        expect(eventNameMatchesQuery('accounts', searchEvent)).toBe(true);
        expect(eventNameMatchesQuery('active staking', searchEvent)).toBe(true);
    });

    it('does NOT match terms that only appear in trigger / attributes', () => {
        expect(eventNameMatchesQuery('user', searchEvent)).toBe(false);
        expect(eventNameMatchesQuery('symbol', searchEvent)).toBe(false);
        expect(eventNameMatchesQuery('suite-sync', searchEvent)).toBe(false);
    });
});

describe('eventMatchesFullText (advanced / everything)', () => {
    it('empty query matches everything', () => {
        expect(eventMatchesFullText('', searchEvent)).toBe(true);
        expect(eventMatchesFullText('   ', searchEvent)).toBe(true);
    });

    it('matches by event name', () => {
        expect(eventMatchesFullText('accounts', searchEvent)).toBe(true);
    });

    it('matches a term in the Trigger description', () => {
        expect(eventMatchesFullText('user', searchEvent)).toBe(true);
        expect(eventMatchesFullText('dashboard', searchEvent)).toBe(true);
    });

    it('matches an attribute name', () => {
        expect(eventMatchesFullText('symbol', searchEvent)).toBe(true);
    });

    it('matches an attribute description', () => {
        expect(eventMatchesFullText('base units', searchEvent)).toBe(true);
    });

    it('matches a union member in an attribute runtime type', () => {
        expect(eventMatchesFullText('suite-sync', searchEvent)).toBe(true);
        expect(eventMatchesFullText('dropbox', searchEvent)).toBe(true);
    });

    it('matches the event description', () => {
        expect(eventMatchesFullText('staking activity', searchEvent)).toBe(true);
    });

    it('is case-insensitive', () => {
        expect(eventMatchesFullText('User', searchEvent)).toBe(
            eventMatchesFullText('user', searchEvent),
        );
        expect(eventMatchesFullText('SYMBOL', searchEvent)).toBe(true);
    });

    it('returns false for a non-matching term', () => {
        expect(eventMatchesFullText('nonexistentterm', searchEvent)).toBe(false);
    });

    it('multi-term query is token-AND across all searchable fields', () => {
        // "user" (trigger) + "symbol" (attribute name) both present
        expect(eventMatchesFullText('user symbol', searchEvent)).toBe(true);
        // "user" present, "missing" absent
        expect(eventMatchesFullText('user missing', searchEvent)).toBe(false);
    });
});

describe('toEventExportName', () => {
    it('converts event name to export name', () => {
        expect(toEventExportName('accounts/active-staking')).toBe('accountsActiveStakingEvent');
        expect(toEventExportName('accounts/actions')).toBe('accountsActionsEvent');
        expect(toEventExportName('accounts/transactions-export')).toBe(
            'accountsTransactionsExportEvent',
        );
    });
});

describe('getEventId', () => {
    it('produces safe DOM id from event name', () => {
        expect(getEventId('accounts/active-staking')).toBe('event-accounts-active-staking');
    });
});

describe('version filtering', () => {
    const eventA = {
        name: 'accounts/active-staking',
        descriptionTrigger: 'trigger',
        changelog: { entries: [{ version: '1.2.0', notes: 'n' }] },
        attributes: {
            attr: { changelog: { entries: [{ version: '1.4.0', notes: 'n' }] } },
        },
        platform: 'desktop',
    } as unknown as EventDoc;

    const eventB = {
        name: 'accounts/actions',
        descriptionTrigger: 'trigger',
        changelog: { entries: [{ version: '1.3.0', notes: 'n' }] },
        attributes: {},
        platform: 'desktop',
    } as unknown as EventDoc;

    it('getAllVersions returns distinct versions newest first', () => {
        expect(getAllVersions([eventA, eventB])).toEqual(['1.4.0', '1.3.0', '1.2.0']);
    });

    it('eventHasVersion matches event and attribute changelog versions', () => {
        expect(eventHasVersion(eventA, '1.2.0')).toBe(true); // event changelog
        expect(eventHasVersion(eventA, '1.4.0')).toBe(true); // attribute changelog
        expect(eventHasVersion(eventA, '1.3.0')).toBe(false);
    });
});

describe('getVersionsWithEvents', () => {
    it('includes both event and attribute changelog versions', () => {
        const eventA = {
            name: 'accounts/active-staking',
            descriptionTrigger: 'trigger',
            changelog: {
                entries: [
                    { version: '1.0.0', notes: 'event note' },
                    { version: '1.1.0', notes: 'event note 2' },
                ],
            },
            attributes: {
                someAttribute: {
                    changelog: {
                        entries: [{ version: '2.0.0', notes: 'attribute-only note' }],
                    },
                },
            },
            platform: 'desktop',
        } as EventDoc;

        const versionsWithEvents = getVersionsWithEvents([eventA]);

        expect(versionsWithEvents.map(v => v.version)).toEqual(['2.0.0', '1.1.0', '1.0.0']);
        expect(versionsWithEvents[0]?.events).toEqual([eventA]);
        expect(versionsWithEvents[1]?.events).toEqual([eventA]);
        expect(versionsWithEvents[2]?.events).toEqual([eventA]);
    });

    it('deduplicates events for the same version', () => {
        const eventA = {
            name: 'accounts/active-staking',
            descriptionTrigger: 'trigger',
            changelog: {
                entries: [
                    { version: '1.0.0', notes: 'first note' },
                    { version: '1.0.0', notes: 'second note' },
                ],
            },
            attributes: {},
            platform: 'desktop',
        } as EventDoc;

        const versionsWithEvents = getVersionsWithEvents([eventA]);

        expect(versionsWithEvents).toHaveLength(1);
        expect(versionsWithEvents[0]?.version).toBe('1.0.0');
        expect(versionsWithEvents[0]?.events).toEqual([eventA]);
    });
});
