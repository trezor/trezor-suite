import { Formatter } from '@suite-common/formatters';
import { isNetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import {
    findToken,
    formatNetworkAmount,
    isDecimalsValid,
    isInteger,
    networkAmountToSmallestUnit,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { TranslationFunction } from 'src/hooks/suite/useTranslation';

interface ValidateDecimalsOptions {
    decimals: number;
    except?: boolean;
}

export const validateDecimals =
    (translationString: TranslationFunction, { decimals, except }: ValidateDecimalsOptions) =>
    (value: string) => {
        if (!except && value) {
            if (!isDecimalsValid(value, decimals)) {
                return translationString('AMOUNT_IS_NOT_IN_RANGE_DECIMALS', {
                    decimals,
                });
            }
        }
    };

interface ValidateIntegerOptions {
    except?: boolean;
}

export const validateInteger =
    (translationString: TranslationFunction, { except }: ValidateIntegerOptions) =>
    (value: string) => {
        if (!except && value && !isInteger(value)) {
            return translationString('AMOUNT_IS_NOT_INTEGER');
        }
    };

export type AmountLimitProps = {
    currency: string;
    minCrypto?: string;
    maxCrypto?: string;

    minFiat?: string;
    maxFiat?: string;
};

export type CryptoAmountLimitProps = Pick<AmountLimitProps, 'currency' | 'minCrypto' | 'maxCrypto'>;

interface ValidateLimitsOptions {
    amountLimits?: CryptoAmountLimitProps;
    areSatsUsed?: boolean;
    formatter: Formatter<string, string>;
}

export const validateCryptoLimits =
    (
        translationString: TranslationFunction,
        { amountLimits, areSatsUsed, formatter }: ValidateLimitsOptions,
    ) =>
    (value: string) => {
        if (value && amountLimits) {
            const currency = amountLimits.currency.toLowerCase();
            let minCrypto = new BigNumber(0);
            let maxCrypto = new BigNumber(0);

            if (amountLimits.minCrypto) {
                minCrypto =
                    areSatsUsed && isNetworkSymbol(currency)
                        ? new BigNumber(
                              networkAmountToSmallestUnit(amountLimits.minCrypto, currency),
                          )
                        : new BigNumber(amountLimits.minCrypto);
            }
            if (amountLimits.minCrypto && new BigNumber(value).lt(minCrypto)) {
                return translationString('TR_BUY_VALIDATION_ERROR_MINIMUM_CRYPTO', {
                    minimum: formatter.format(amountLimits.minCrypto, {
                        isBalance: true,
                        currency,
                    }),
                });
            }

            if (amountLimits.maxCrypto) {
                maxCrypto =
                    areSatsUsed && isNetworkSymbol(currency)
                        ? new BigNumber(
                              networkAmountToSmallestUnit(amountLimits.maxCrypto, currency),
                          )
                        : new BigNumber(amountLimits.maxCrypto);
            }

            if (amountLimits.maxCrypto && new BigNumber(value).gt(maxCrypto)) {
                return translationString('TR_BUY_VALIDATION_ERROR_MAXIMUM_CRYPTO', {
                    maximum: formatter.format(amountLimits.maxCrypto, {
                        isBalance: true,
                        currency,
                    }),
                });
            }
        }
    };

interface ValidateMinOptions {
    except?: boolean;
}

export const validateMin =
    (translationString: TranslationFunction, options?: ValidateMinOptions) => (value: string) => {
        if (!options?.except && value && Number(value) <= 0) {
            return translationString('AMOUNT_IS_TOO_LOW');
        }
    };

interface ValidateReserveOrBalanceOptions {
    account: Account;
    areSatsUsed?: boolean;
    tokenAddress?: string | null;
}

export const validateReserveOrBalance =
    (
        translationString: TranslationFunction,
        { account, areSatsUsed, tokenAddress }: ValidateReserveOrBalanceOptions,
    ) =>
    (value: string) => {
        const token = findToken(account.tokens, tokenAddress);
        let formattedAvailableBalance: string;

        if (token) {
            formattedAvailableBalance = token.balance || '0';
        } else {
            formattedAvailableBalance = areSatsUsed
                ? account.availableBalance
                : formatNetworkAmount(account.availableBalance, account.symbol);
        }

        const amountBig = new BigNumber(value);
        if (amountBig.gt(formattedAvailableBalance)) {
            const reserve =
                account.networkType === 'ripple'
                    ? formatNetworkAmount(account.misc.reserve, account.symbol)
                    : undefined;

            if (reserve && amountBig.lt(formatNetworkAmount(account.balance, account.symbol))) {
                return translationString('AMOUNT_IS_MORE_THAN_RESERVE', { reserve });
            }

            return translationString('AMOUNT_IS_NOT_ENOUGH');
        }
    };
