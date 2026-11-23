import { isNetworkSymbol } from '@suite-common/wallet-config';
import { asAmountUnit, unitsToSubunits } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { type TradingAmountLimitProps } from '../types';

const FIAT_DECIMALS = 2;

export type TradingAmountLimitType = 'min' | 'max';

type RoundLimitInwardsParams = {
    amount: BigNumber;
    decimals: number;
    limit: TradingAmountLimitType;
};

const roundLimitInwards = ({ amount, decimals, limit }: RoundLimitInwardsParams) =>
    amount
        .decimalPlaces(decimals, limit === 'min' ? BigNumber.ROUND_UP : BigNumber.ROUND_DOWN)
        .toFixed();

type GetTradingFiatLimitAmountParams = {
    limit: TradingAmountLimitType;
    amountLimits: TradingAmountLimitProps;
};

export const getTradingFiatLimitAmount = ({
    limit,
    amountLimits,
}: GetTradingFiatLimitAmountParams): string | undefined => {
    const amount = limit === 'min' ? amountLimits.minFiat : amountLimits.maxFiat;

    if (!amount) {
        return undefined;
    }

    return roundLimitInwards({ amount: new BigNumber(amount), decimals: FIAT_DECIMALS, limit });
};

type GetTradingCryptoLimitAmountParams = {
    limit: TradingAmountLimitType;
    amountLimits: TradingAmountLimitProps;
    isInSats: boolean;
    cryptoDecimals: number;
};

export const getTradingCryptoLimitAmount = ({
    limit,
    amountLimits,
    isInSats,
    cryptoDecimals,
}: GetTradingCryptoLimitAmountParams): string | undefined => {
    const amount = limit === 'min' ? amountLimits.minCrypto : amountLimits.maxCrypto;

    if (!amount) {
        return undefined;
    }

    const currency = amountLimits.currency.toLowerCase();
    const units = new BigNumber(amount);

    if (isInSats && isNetworkSymbol(currency)) {
        return roundLimitInwards({
            amount: unitsToSubunits({ value: asAmountUnit(units), symbol: currency }),
            decimals: 0,
            limit,
        });
    }

    return roundLimitInwards({ amount: units, decimals: cryptoDecimals, limit });
};
