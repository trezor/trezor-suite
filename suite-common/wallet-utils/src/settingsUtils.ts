import { type Account } from '@suite-common/wallet-types';
import { PROTO } from '@trezor/connect';

import { hasNetworkFeatures } from './accountUtils';

export const getAreSatoshisUsed = (bitcoinAmountUnit: PROTO.AmountUnit, account: Account) => {
    const areSatsDisplayed = bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI;

    const areUnitsSupportedByNetwork = hasNetworkFeatures(account, 'amount-unit');

    return areSatsDisplayed && areUnitsSupportedByNetwork;
};
