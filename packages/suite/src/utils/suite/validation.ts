import { type TranslationFunction } from '@suite/intl';
import { type Formatter, type Formatters } from '@suite-common/formatters';
import {
    type NetworkConfigDeps,
    getDisplaySymbol,
    getNetworkDisplaySymbol,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import { type Account, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import {
    fromBaseCurrencyToCryptoUnit,
    getAmountValidationResult,
    getSolanaUnstakeAmountBounds,
    isAmountWithinNetworkReserve,
    isDecimalsValid,
    isInteger,
    networkAmountToSmallestUnit,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

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

interface ValidateCryptoLimitsOptions extends NetworkConfigDeps {
    amountLimits?: AmountLimitProps;
    areSatsUsed?: boolean;
    formatter: Formatter<string, string>;
}

export const validateCryptoLimits =
    (
        translationString: TranslationFunction,
        { amountLimits, areSatsUsed, formatter, ...networkConfigDeps }: ValidateCryptoLimitsOptions,
    ) =>
    (value: string) => {
        if (value && amountLimits) {
            const currency = amountLimits.currency.toLowerCase();
            let minCrypto = new BigNumber(0);
            let maxCrypto = new BigNumber(0);

            if (amountLimits.minCrypto) {
                minCrypto =
                    areSatsUsed && isNetworkSymbol(networkConfigDeps, currency)
                        ? new BigNumber(
                              networkAmountToSmallestUnit(
                                  networkConfigDeps,
                                  amountLimits.minCrypto,
                                  currency,
                              ),
                          )
                        : new BigNumber(amountLimits.minCrypto);
            }
            if (amountLimits.minCrypto && new BigNumber(value).lt(minCrypto)) {
                return translationString('TR_BUY_VALIDATION_ERROR_MINIMUM_CRYPTO', {
                    minimum: formatter
                        .format(amountLimits.minCrypto, {
                            isBalance: true,
                            symbol: currency,
                            shouldRedactNumbers: false,
                            maxDisplayedDecimals: 18,
                        })
                        .toUpperCase(),
                });
            }

            if (amountLimits.maxCrypto) {
                maxCrypto =
                    areSatsUsed && isNetworkSymbol(networkConfigDeps, currency)
                        ? new BigNumber(
                              networkAmountToSmallestUnit(
                                  networkConfigDeps,
                                  amountLimits.maxCrypto,
                                  currency,
                              ),
                          )
                        : new BigNumber(amountLimits.maxCrypto);
            }

            if (amountLimits.maxCrypto && new BigNumber(value).gt(maxCrypto)) {
                if (minCrypto.gt(0) && minCrypto.lte(new BigNumber(value))) {
                    const missingAmount = new BigNumber(value).minus(maxCrypto);

                    return translationString(
                        'TR_STAKING_VALIDATION_ERROR_NOT_ENOUGH_FOR_FEES_CRYPTO',
                        {
                            missingAmount: formatter.format(missingAmount.toString(), {
                                isBalance: true,
                                symbol: currency,
                                shouldRedactNumbers: false,
                                maxDisplayedDecimals: 18,
                            }),
                        },
                    );
                }

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

interface ValidateSolanaUnstakeAmountOptions extends NetworkConfigDeps {
    account: Account;
}

export const validateSolanaUnstakeAmount =
    (
        translationString: TranslationFunction,
        { account, ...networkConfigDeps }: ValidateSolanaUnstakeAmountOptions,
    ) =>
    (value: string) => {
        if (!value) return;

        const bounds = getSolanaUnstakeAmountBounds(networkConfigDeps, account, value);
        if (!bounds) return;

        const symbol = getNetworkDisplaySymbol(networkConfigDeps, account.symbol);

        // the fiat approximations are only rendered in the rich <Translation> banner
        return bounds.closestLower
            ? translationString('TR_STAKE_SOL_INVALID_UNSTAKE_AMOUNT', {
                  lower: bounds.closestLower,
                  higher: bounds.closestHigher,
                  symbol,
                  lowerFiat: '',
                  higherFiat: '',
              })
            : translationString('TR_STAKE_SOL_INVALID_UNSTAKE_AMOUNT_HIGHER_ONLY', {
                  higher: bounds.closestHigher,
                  symbol,
                  higherFiat: '',
              });
    };

interface ValidateSolanaUnstakeFiatAmountOptions extends NetworkConfigDeps {
    account: Account;
    decimals: number;
    rate?: number;
}

export const validateSolanaUnstakeFiatAmount =
    (
        translationString: TranslationFunction,
        { account, decimals, rate, ...networkConfigDeps }: ValidateSolanaUnstakeFiatAmountOptions,
    ) =>
    (value: string, formValues?: { outputs?: { amount?: string }[] }) => {
        if (!value) return;

        const cryptoAmount = fromBaseCurrencyToCryptoUnit({ fiatAmount: value, rate })?.toFixed(
            decimals,
        );
        if (!cryptoAmount) return;

        const outputAmount = formValues?.outputs?.[0]?.amount;
        const isFiatOfOutputAmount =
            !!outputAmount &&
            toFiatCurrency({ amount: outputAmount, rate })?.toFixed(2, BigNumber.ROUND_FLOOR) ===
                value;

        return validateSolanaUnstakeAmount(translationString, { ...networkConfigDeps, account })(
            isFiatOfOutputAmount ? outputAmount : cryptoAmount,
        );
    };

interface ValidateFiatLimitsOptions {
    amountLimits?: AmountLimitProps;
    localCurrency: BaseCurrencyCode;
    decimals: number;
    rate?: number;
    formatter: Formatter<string, string>;
    fiatFormatter: Formatters['BaseCurrencyAmountFormatter'];
}

export const validateFiatLimits =
    (
        translationString: TranslationFunction,
        {
            amountLimits,
            localCurrency,
            formatter,
            fiatFormatter,
            decimals,
            rate,
        }: ValidateFiatLimitsOptions,
    ) =>
    (value: string, formValues?: { setMaxOutputId?: number }) => {
        if (value && amountLimits) {
            const currency = amountLimits.currency.toLowerCase();
            const cryptoAmount = fromBaseCurrencyToCryptoUnit({ fiatAmount: value, rate })?.toFixed(
                decimals,
            );
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

            // crypto field is source-of-truth in Max mode (fiat round-trip is lossy at the boundary)
            if (formValues?.setMaxOutputId !== undefined) return;

            if (amountLimits.maxFiat && new BigNumber(value).gt(amountLimits.maxFiat)) {
                if (
                    amountLimits.minCrypto &&
                    new BigNumber(amountLimits.minCrypto).gt(0) &&
                    new BigNumber(amountLimits.minCrypto).lte(new BigNumber(cryptoAmount ?? '0'))
                ) {
                    const missingAmount = new BigNumber(value).minus(amountLimits.maxFiat);

                    return translationString(
                        'TR_STAKING_VALIDATION_ERROR_NOT_ENOUGH_FOR_FEES_FIAT',
                        {
                            missingAmount:
                                fiatFormatter.format(asBaseCurrencyAmount(missingAmount), {
                                    style: 'decimal',
                                }) ?? missingAmount.toFixed(2),
                            currency: localCurrency.toUpperCase(),
                        },
                    );
                }

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

interface ValidateReserveOrBalanceOptions extends NetworkConfigDeps {
    account: Account;
    areSatsUsed?: boolean;
    contractAddress?: string | null;
}

export const validateReserveOrBalance =
    (
        translationString: TranslationFunction,
        {
            account,
            areSatsUsed,
            contractAddress,
            ...networkConfigDeps
        }: ValidateReserveOrBalanceOptions,
    ) =>
    (value: string) => {
        const result = getAmountValidationResult({
            ...networkConfigDeps,
            amount: value,
            account,
            areSatsUsed,
            contractAddress,
        });

        if (result.type === 'reserve') {
            return translationString('AMOUNT_IS_MORE_THAN_RESERVE', {
                reserve: result.reserve,
                displaySymbol: getDisplaySymbol(networkConfigDeps, account.symbol),
            });
        }

        if (result.type === 'not_enough') {
            return translationString('AMOUNT_IS_NOT_ENOUGH');
        }

        return undefined;
    };

interface ValidateNetworkReserveOptions {
    reserve?: string;
    balance?: string;
    fee?: string;
}

export const validateNetworkReserve =
    (
        translationString: TranslationFunction,
        { reserve, balance, fee = '0' }: ValidateNetworkReserveOptions,
    ) =>
    (value: string) => {
        if (!isAmountWithinNetworkReserve({ reserve, balance, fee, amount: value })) {
            return translationString('AMOUNT_EXCEEDS_NETWORK_RESERVE');
        }
    };
