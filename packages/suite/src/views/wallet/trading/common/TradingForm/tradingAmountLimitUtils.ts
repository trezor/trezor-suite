import {
    type TradingAmountLimitType,
    getTradingCryptoLimitAmount,
    getTradingFiatLimitAmount,
} from '@suite-common/trading';
import { BigNumber } from '@trezor/utils';

import { type AmountLimitProps } from '#src/utils/suite/validation';

import {
    TRADING_CRYPTO_LIMITS_RULE,
    TRADING_FIAT_MAX_RULE,
    TRADING_FIAT_MIN_RULE,
} from './TradingFormInput/TradingFormInputFiatCrypto/tradingFormInputFiatCryptoRules';

export type TradingAmountLimit = {
    limit: TradingAmountLimitType;
    amountType: 'crypto' | 'fiat';
    amount: string;
};

type GetFiatAmountLimitParams = {
    limit: TradingAmountLimitType;
    amountLimits: AmountLimitProps;
};

const getFiatAmountLimit = ({
    limit,
    amountLimits,
}: GetFiatAmountLimitParams): TradingAmountLimit | undefined => {
    const amount = getTradingFiatLimitAmount({ limit, amountLimits });

    return amount === undefined ? undefined : { limit, amountType: 'fiat', amount };
};

type GetCryptoAmountLimitParams = {
    cryptoAmount: string | undefined;
    amountLimits: AmountLimitProps;
    isInSats: boolean;
    cryptoDecimals: number;
};

const getCryptoAmountLimit = ({
    cryptoAmount,
    amountLimits,
    isInSats,
    cryptoDecimals,
}: GetCryptoAmountLimitParams): TradingAmountLimit | undefined => {
    const value = new BigNumber(cryptoAmount ?? '');
    const min = getTradingCryptoLimitAmount({
        limit: 'min',
        amountLimits,
        isInSats,
        cryptoDecimals,
    });
    const max = getTradingCryptoLimitAmount({
        limit: 'max',
        amountLimits,
        isInSats,
        cryptoDecimals,
    });

    if (min !== undefined && value.lt(min)) {
        return { limit: 'min', amountType: 'crypto', amount: min };
    }

    const isReportedAsMissingFees = min !== undefined && new BigNumber(min).gt(0);

    if (max !== undefined && value.gt(max) && !isReportedAsMissingFees) {
        return { limit: 'max', amountType: 'crypto', amount: max };
    }

    return undefined;
};

type GetTradingAmountLimitParams = {
    errorType: string | undefined;
    cryptoAmount: string | undefined;
    amountLimits: AmountLimitProps | undefined;
    isInSats: boolean;
    cryptoDecimals: number;
};

export const getTradingAmountLimit = ({
    errorType,
    cryptoAmount,
    amountLimits,
    isInSats,
    cryptoDecimals,
}: GetTradingAmountLimitParams): TradingAmountLimit | undefined => {
    if (!amountLimits) {
        return undefined;
    }

    switch (errorType) {
        case TRADING_FIAT_MIN_RULE:
            return getFiatAmountLimit({ limit: 'min', amountLimits });
        case TRADING_FIAT_MAX_RULE:
            return getFiatAmountLimit({ limit: 'max', amountLimits });
        case TRADING_CRYPTO_LIMITS_RULE:
            return getCryptoAmountLimit({ cryptoAmount, amountLimits, isInSats, cryptoDecimals });
        default:
            return undefined;
    }
};
