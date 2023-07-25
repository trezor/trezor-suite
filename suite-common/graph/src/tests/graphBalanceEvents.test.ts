import { AccountBalanceHistory } from '@trezor/blockchain-link';

import {
    formatBalanceMovementEventsAmounts,
    groupBalanceMovementEvents,
    mergeGroups,
} from '../graphBalanceEvents';
import { BalanceMovementEvent, GroupedBalanceMovementEvent } from '../types';

describe('formatBalanceMovementEventsAmounts', () => {
    it('should calculate received and sent values for each balance movement', () => {
        const balanceMovements: AccountBalanceHistory[] = [
            {
                time: 1633449600,
                txs: 1,
                received: '10',
                sent: '5',
                sentToSelf: '2',
                rates: {},
            },
            {
                time: 1633536000,
                txs: 1,
                received: '8',
                sent: '3',
                sentToSelf: '1',
                rates: {},
            },
        ];

        const expectedBalanceMovementEvents: BalanceMovementEvent[] = [
            {
                date: 1633449600,
                payload: {
                    sent: 3, // (5 - 2)
                    received: 8, // (10 - 2)
                },
            },
            {
                date: 1633536000,
                payload: {
                    sent: 2, // (3 - 1)
                    received: 7, // (8 - 1)
                },
            },
        ];

        const result = formatBalanceMovementEventsAmounts(balanceMovements);
        expect(result).toEqual(expectedBalanceMovementEvents);
    });

    it('should handle missing sentToSelf property', () => {
        const balanceMovements: AccountBalanceHistory[] = [
            {
                time: 1633449600,
                txs: 1,
                received: '10',
                sent: '5',
                rates: {},
            },
        ];

        const expectedBalanceMovementEvents: BalanceMovementEvent[] = [
            {
                date: 1633449600,
                payload: {
                    sent: 5,
                    received: 10,
                },
            },
        ];

        const result = formatBalanceMovementEventsAmounts(balanceMovements);
        expect(result).toEqual(expectedBalanceMovementEvents);
    });
});

describe('groupBalanceMovementEvents', () => {
    it('should group adjacent balance movements together based on the grouping threshold', () => {
        const balanceMovements: BalanceMovementEvent[] = [
            {
                date: 1633440000,
                payload: {
                    received: 10,
                    sent: 5,
                },
            },
            {
                date: 1633444000,
                payload: {
                    received: 8,
                    sent: 3,
                },
            },
            {
                date: 1634622400,
                payload: {
                    received: 5,
                    sent: 2,
                },
            },
            {
                date: 1634708800,
                payload: {
                    received: 12,
                    sent: 6,
                },
            },
        ];

        const groupingThreshold = 86400; // 1 day in seconds

        const expectedGroups: BalanceMovementEvent[][] = [
            [
                {
                    date: 1633440000,
                    payload: {
                        received: 10,
                        sent: 5,
                    },
                },
                {
                    date: 1633444000,
                    payload: {
                        received: 8,
                        sent: 3,
                    },
                },
            ],
            [
                {
                    date: 1634622400,
                    payload: {
                        received: 5,
                        sent: 2,
                    },
                },
            ],
            [
                {
                    date: 1634708800,
                    payload: {
                        received: 12,
                        sent: 6,
                    },
                },
            ],
        ];

        const result = groupBalanceMovementEvents(balanceMovements, groupingThreshold);
        expect(result).toEqual(expectedGroups);
    });

    it('should handle empty balance movements array', () => {
        const balanceMovements: BalanceMovementEvent[] = [];
        const groupingThreshold = 86400;

        const expectedGroups: BalanceMovementEvent[][] = [];

        const result = groupBalanceMovementEvents(balanceMovements, groupingThreshold);
        expect(result).toEqual(expectedGroups);
    });

    it('should handle single balance movement', () => {
        const balanceMovements: BalanceMovementEvent[] = [
            {
                date: 1633449600,
                payload: {
                    received: 10,
                    sent: 5,
                },
            },
        ];
        const groupingThreshold = 86400;

        const expectedGroups: BalanceMovementEvent[][] = [
            [
                {
                    date: 1633449600,
                    payload: {
                        received: 10,
                        sent: 5,
                    },
                },
            ],
        ];

        const result = groupBalanceMovementEvents(balanceMovements, groupingThreshold);
        expect(result).toEqual(expectedGroups);
    });
});

describe('mergeGroups', () => {
    it('should merge balance movements groups correctly', () => {
        const groups: BalanceMovementEvent[][] = [
            [
                {
                    date: 1633449600,
                    payload: {
                        received: 10,
                        sent: 5,
                    },
                },
                {
                    date: 1633536000,
                    payload: {
                        received: 8,
                        sent: 3,
                    },
                },
            ],
            [
                {
                    date: 1633622400,
                    payload: {
                        received: 5,
                        sent: 2,
                    },
                },
            ],
        ];

        const networkSymbol = 'btc';

        const expectedMergedGroups: GroupedBalanceMovementEvent[] = [
            {
                date: new Date(1633492800000),
                payload: {
                    received: 18,
                    sent: 8,
                    sentTransactionsCount: 2,
                    receivedTransactionsCount: 2,
                    networkSymbol: 'btc',
                },
            },
            {
                date: new Date(1633622400000),
                payload: {
                    received: 5,
                    sent: 2,
                    sentTransactionsCount: 1,
                    receivedTransactionsCount: 1,
                    networkSymbol: 'btc',
                },
            },
        ];

        const result = mergeGroups(groups, networkSymbol);
        expect(result).toEqual(expectedMergedGroups);
    });

    it('should handle empty groups array', () => {
        const groups: BalanceMovementEvent[][] = [];
        const networkSymbol = 'btc';

        const expectedMergedGroups: GroupedBalanceMovementEvent[] = [];

        const result = mergeGroups(groups, networkSymbol);
        expect(result).toEqual(expectedMergedGroups);
    });
});
