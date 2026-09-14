import { type NetworkConfigDeps } from '@suite-common/networks';
import { type Account } from '@suite-common/wallet-types';
import { PROTO } from '@trezor/connect';

import { hasNetworkFeatures } from './accountUtils';

export const getAreSatoshisUsed = (
    networkConfigDeps: NetworkConfigDeps,
    bitcoinAmountUnit: PROTO.AmountUnit,
    account: Account,
) => {
    const areSatsDisplayed = bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI;

    const areUnitsSupportedByNetwork = hasNetworkFeatures(
        networkConfigDeps,
        account,
        'amount-unit',
    );

    return areSatsDisplayed && areUnitsSupportedByNetwork;
};
