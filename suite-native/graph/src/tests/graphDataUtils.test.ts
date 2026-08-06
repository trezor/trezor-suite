import {
    type FiatGraphPointWithCryptoBalance,
    type GroupedBalanceMovementEvent,
} from '@suite-common/graph';
import { type AccountKey } from '@suite-common/wallet-types';

import {
    deserializeGraphEvents,
    deserializeGraphPoints,
    serializeGraphEvents,
    serializeGraphPoints,
} from '../graphDataUtils';

describe('graphDataUtils', () => {
    it('serializes graph point dates as timestamps', () => {
        const points: FiatGraphPointWithCryptoBalance[] = [
            {
                date: new Date(1000),
                value: 12,
                cryptoBalance: '0.42',
            },
        ];

        expect(serializeGraphPoints(points)).toEqual([
            {
                date: 1000,
                value: 12,
                cryptoBalance: '0.42',
            },
        ]);
    });

    it('deserializes graph point timestamps as dates', () => {
        const [point] = deserializeGraphPoints<FiatGraphPointWithCryptoBalance>([
            {
                date: 1000,
                value: 12,
                cryptoBalance: '0.42',
            },
        ]);

        expect(point).toEqual({
            date: new Date(1000),
            value: 12,
            cryptoBalance: '0.42',
        });
    });

    it('serializes and deserializes graph event dates', () => {
        const events: GroupedBalanceMovementEvent[] = [
            {
                date: new Date(2000),
                payload: {
                    received: 1,
                    sent: 2,
                    sentTransactionsCount: 1,
                    receivedTransactionsCount: 1,
                    symbol: 'eth',
                    accountKey: 'account-key' as AccountKey,
                },
            },
        ];

        expect(deserializeGraphEvents(serializeGraphEvents(events))).toEqual([
            {
                ...events[0],
                date: new Date(2000),
            },
        ]);
    });

    it('returns stable empty arrays', () => {
        expect(deserializeGraphPoints(undefined)).toBe(deserializeGraphPoints(undefined));
        expect(deserializeGraphEvents(undefined)).toBe(deserializeGraphEvents(undefined));
    });
});
