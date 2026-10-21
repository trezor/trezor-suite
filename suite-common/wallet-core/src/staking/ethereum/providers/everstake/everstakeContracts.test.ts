import { asNetworkSymbol } from '@suite-common/wallet-config';
import { EVERSTAKE_CONTRACTS } from '@trezor/network-ethereum/staking';

import { getEverstakeStepTarget } from './everstakeContracts';

describe(getEverstakeStepTarget.name, () => {
    it('resolves the mainnet deployment for eth', () => {
        expect(getEverstakeStepTarget('stake', asNetworkSymbol('eth'))).toBe(
            EVERSTAKE_CONTRACTS[1].pool,
        );
        expect(getEverstakeStepTarget('claim', asNetworkSymbol('eth'))).toBe(
            EVERSTAKE_CONTRACTS[1].accounting,
        );
    });

    it('resolves the Hoodi deployment for thod', () => {
        expect(getEverstakeStepTarget('unstake', asNetworkSymbol('thod'))).toBe(
            EVERSTAKE_CONTRACTS[560048].pool,
        );
    });

    it('is null on a network without a deployment', () => {
        expect(getEverstakeStepTarget('stake', asNetworkSymbol('btc'))).toBeNull();
    });
});
