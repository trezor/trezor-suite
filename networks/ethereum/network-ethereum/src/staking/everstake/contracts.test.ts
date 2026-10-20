import { checksumAddress, isAddress } from 'viem';

import { EVERSTAKE_CONTRACTS, getEverstakeContracts, isEverstakeChainId } from './contracts';

describe('EVERSTAKE_CONTRACTS', () => {
    it.each(Object.entries(EVERSTAKE_CONTRACTS))(
        'has valid checksummed addresses on chain %s',
        (_, contracts) => {
            Object.values(contracts).forEach(address => {
                expect(isAddress(address, { strict: false })).toBe(true);
                expect(address).toBe(checksumAddress(address));
            });
        },
    );
});

describe(getEverstakeContracts.name, () => {
    it('returns the mainnet deployment for chain 1', () => {
        expect(getEverstakeContracts(1)?.pool).toBe('0xD523794C879D9eC028960a231F866758e405bE34');
    });

    it('returns the Hoodi deployment for chain 560048', () => {
        expect(getEverstakeContracts(560048)?.accounting).toBe(
            '0x6Cf2F03804b171ef9CAFC71e302CA0e08A3FDC28',
        );
    });

    it('returns undefined for a chain without a deployment', () => {
        expect(getEverstakeContracts(137)).toBeUndefined();
        expect(isEverstakeChainId(137)).toBe(false);
    });
});
