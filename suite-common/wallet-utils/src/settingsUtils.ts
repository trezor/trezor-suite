import { PROTO } from '@trezor/connect';
import { Account } from '@suite-common/wallet-types';

import { hasNetworkFeatures } from './accountUtils';

export const getLocalCurrency = (localCurrency: string) => ({
    value: localCurrency,
    label: localCurrency.toUpperCase(),
});

export const getAreSatoshisUsed = (bitcoinAmountUnit: PROTO.AmountUnit, account: Account) => {
    const areSatsDisplayed = bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI;

    const areUnitsSupportedByNetwork = hasNetworkFeatures(account, 'amount-unit');

    return areSatsDisplayed && areUnitsSupportedByNetwork;
};
