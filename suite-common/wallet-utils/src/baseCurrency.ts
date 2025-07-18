import { NetworkSymbol, networks } from '@suite-common/wallet-config';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { Branded } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

/**
 * Value in EUR, USD, ... but also it can be in BTC, currently the global BaseCurrency from the Settings is used.
 */
export type BaseCurrencyAmount = BigNumber & Branded<`base-currency-amount`>;
export const asBaseCurrencyAmount = (value: BigNumber) => value as BaseCurrencyAmount;

export const BASE_CURRENCY_ZERO = asBaseCurrencyAmount(new BigNumber(0));

export const isBaseCurrencyWithSats = (baseCurrency: BaseCurrencyCode) => baseCurrency === 'btc';

type GetDecimalsForBaseCurrencyParams = {
    code: BaseCurrencyCode | '';
    areSatsDisplayed: boolean;
};

export const getDecimalsForBaseCurrency = ({
    code,
    areSatsDisplayed,
}: GetDecimalsForBaseCurrencyParams) => {
    if (code === 'btc' && areSatsDisplayed) {
        return 0;
    }

    return code in networks ? networks[code as NetworkSymbol].decimals : 2;
};
