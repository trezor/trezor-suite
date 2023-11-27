import { Formatter } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import {
    findToken,
    formatNetworkAmount,
    isDecimalsValid,
    isInteger,
    networkAmountToSatoshi,
} from '@suite-common/wallet-utils';
import BigNumber from 'bignumber.js';
import { TranslationFunction } from 'src/hooks/suite/useTranslation';
import { AmountLimits } from 'src/types/wallet/coinmarketCommonTypes';

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

interface ValidateLimitsOptions {
    amountLimits?: AmountLimits;
    areSatsUsed?: boolean;
    formatter: Formatter<string, string>;
}

export const validateLimits =
    (
        translationString: TranslationFunction,
        { amountLimits, areSatsUsed, formatter }: ValidateLimitsOptions,
    ) =>
    (value: string) => {
        if (value && amountLimits) {
            const symbol = amountLimits.currency.toLowerCase() as NetworkSymbol;
            let minCrypto = 0;
            if (amountLimits.minCrypto) {
                minCrypto = areSatsUsed
                    ? Number(networkAmountToSatoshi(amountLimits.minCrypto.toString(), symbol))
                    : amountLimits.minCrypto;
            }
            if (amountLimits.minCrypto && Number(value) < minCrypto) {
                return translationString('TR_VALIDATION_ERROR_MINIMUM_CRYPTO', {
                    minimum: formatter.format(amountLimits.minCrypto.toString(), {
                        isBalance: true,
                        symbol,
                    }),
                });
            }

            let maxCrypto = 0;
            if (amountLimits.maxCrypto) {
                maxCrypto = areSatsUsed
                    ? Number(networkAmountToSatoshi(amountLimits.maxCrypto.toString(), symbol))
                    : amountLimits.maxCrypto;
            }
            if (amountLimits.maxCrypto && Number(value) > maxCrypto) {
                return translationString('TR_VALIDATION_ERROR_MAXIMUM_CRYPTO', {
                    maximum: formatter.format(amountLimits.maxCrypto.toString(), {
                        isBalance: true,
                        symbol,
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
