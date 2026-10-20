import { asNetworkSymbol } from '@suite-common/wallet-config';
import { EVERSTAKE_CONTRACTS } from '@trezor/network-ethereum/staking';

import { getEverstakeContractAddressByStakeType } from './everstakeContracts';

describe(getEverstakeContractAddressByStakeType.name, () => {
    it('resolves the mainnet deployment for eth', () => {
        expect(getEverstakeContractAddressByStakeType(asNetworkSymbol('eth'), 'stake')).toBe(
            EVERSTAKE_CONTRACTS[1].pool,
        );
        expect(getEverstakeContractAddressByStakeType(asNetworkSymbol('eth'), 'claim')).toBe(
            EVERSTAKE_CONTRACTS[1].accounting,
        );
    });

    it('resolves the Hoodi deployment for thod', () => {
        expect(getEverstakeContractAddressByStakeType(asNetworkSymbol('thod'), 'unstake')).toBe(
            EVERSTAKE_CONTRACTS[560048].pool,
        );
    });

    it('returns an empty address for a network without a deployment', () => {
        expect(getEverstakeContractAddressByStakeType(asNetworkSymbol('btc'), 'stake')).toBe('');
    });
});
