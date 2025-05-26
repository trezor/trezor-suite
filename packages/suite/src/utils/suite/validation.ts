import { Formatter } from '@suite-common/formatters';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { getDisplaySymbol, isNetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import {
    fromFiatCurrency,
    getAmountValidationResult,
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

interface ValidateCryptoLimitsOptions {
    amountLimits?: AmountLimitProps;
    areSatsUsed?: boolean;
    formatter: Formatter<string, string>;
}

export const validateCryptoLimits =
    (
        translationString: TranslationFunction,
        { amountLimits, areSatsUsed, formatter }: ValidateCryptoLimitsOptions,
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
                        symbol: currency,
                        shouldRedactNumbers: false,
                        maxDisplayedDecimals: 18,
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
                        symbol: currency,
                        shouldRedactNumbers: false,
                        maxDisplayedDecimals: 18,
                    }),
                });
            }
        }
    };

interface ValidateFiatLimitsOptions {
    amountLimits?: AmountLimitProps;
    localCurrency: FiatCurrencyCode;
    decimals: number;
    rate?: number;
    formatter: Formatter<string, string>;
}

export const validateFiatLimits =
    (
        translationString: TranslationFunction,
        { amountLimits, localCurrency, formatter, decimals, rate }: ValidateFiatLimitsOptions,
    ) =>
    (value: string) => {
        if (value && amountLimits) {
            const currency = amountLimits.currency.toLowerCase();
            const cryptoAmount = fromFiatCurrency(value, decimals, rate);
            if (!cryptoAmount) return translationString('TR_FIAT_RATES_NOT_AVAILABLE');

            if (amountLimits.minFiat && new BigNumber(value).lt(amountLimits.minFiat)) {
                return translationString('TR_BUY_VALIDATION_ERROR_MINIMUM_FIAT', {
                    minimum: amountLimits.minFiat,
                    currency: localCurrency.toUpperCase(),
                });
            }

            // if fiat validation passes we still need to check crypto amount because of floating-point precision errors
            if (amountLimits.minCrypto && new BigNumber(cryptoAmount).lt(amountLimits.minCrypto)) {
                return translationString('TR_BUY_VALIDATION_ERROR_MINIMUM_CRYPTO', {
                    minimum: formatter.format(amountLimits.minCrypto, {
                        isBalance: true,
                        symbol: currency,
                        shouldRedactNumbers: false,
                        maxDisplayedDecimals: 18,
                    }),
                });
            }

            if (amountLimits.maxFiat && new BigNumber(value).gt(amountLimits.maxFiat)) {
                return translationString('TR_BUY_VALIDATION_ERROR_MAXIMUM_FIAT', {
                    maximum: amountLimits.maxFiat,
                    currency: localCurrency.toUpperCase(),
                });
            }

            if (amountLimits.maxCrypto && new BigNumber(cryptoAmount).gt(amountLimits.maxCrypto)) {
                return translationString('TR_BUY_VALIDATION_ERROR_MAXIMUM_CRYPTO', {
                    maximum: formatter.format(amountLimits.maxCrypto, {
                        isBalance: true,
                        symbol: currency,
                        shouldRedactNumbers: false,
                        maxDisplayedDecimals: 18,
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
    contractAddress?: string | null;
}

export const validateReserveOrBalance =
    (
        translationString: TranslationFunction,
        { account, areSatsUsed, contractAddress }: ValidateReserveOrBalanceOptions,
    ) =>
    (value: string) => {
        const result = getAmountValidationResult({
            amount: value,
            account,
            areSatsUsed,
            contractAddress,
        });

        if (result.type === 'reserve') {
            return translationString('AMOUNT_IS_MORE_THAN_RESERVE', {
                reserve: result.reserve,
                displaySymbol: getDisplaySymbol(account.symbol),
            });
        }

        if (result.type === 'not_enough') {
            return translationString('AMOUNT_IS_NOT_ENOUGH');
        }

        return undefined;
    };
