import type { Transaction } from '@trezor/blockchain-link-types';

import { getHistoricRateRequests, toRateHour } from './getHistoricRateRequests';

const HOUR = 3600;

const tx = (blockTime: number | undefined, contracts: string[] = []) =>
    ({ blockTime, tokens: contracts.map(contract => ({ contract })) }) as unknown as Transaction;

describe('getHistoricRateRequests', () => {
    it('rounds times down to the hour', () => {
        expect(toRateHour(5 * HOUR + 1234)).toBe(5 * HOUR);
    });

    it('asks for the coin at every confirmed hour and each token at its own hours', () => {
        expect(
            getHistoricRateRequests([
                tx(3 * HOUR + 10, ['0xusdc']),
                tx(3 * HOUR + 20),
                tx(1 * HOUR, ['0xusdc', '0xweth']),
                tx(undefined, ['0xusdc']),
            ]),
        ).toEqual([
            { contract: undefined, timestamps: [1 * HOUR, 3 * HOUR] },
            { contract: '0xusdc', timestamps: [1 * HOUR, 3 * HOUR] },
            { contract: '0xweth', timestamps: [1 * HOUR] },
        ]);
    });
});
