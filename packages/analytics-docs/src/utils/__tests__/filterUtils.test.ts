import type { EventDoc } from '../../types';
import {
    fuzzyMatch,
    fuzzyMatchExportName,
    getEventId,
    getVersionsWithEvents,
    toEventExportName,
} from '../filterUtils';

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
