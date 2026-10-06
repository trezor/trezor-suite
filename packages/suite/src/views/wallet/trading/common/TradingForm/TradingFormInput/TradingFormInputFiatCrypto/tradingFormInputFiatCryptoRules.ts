import { type UseControllerProps } from 'react-hook-form';

import { type TranslationFunction } from '@suite/intl';
import { type Formatter } from '@suite-common/formatters';
import { type Account } from '@suite-common/wallet-types';
import {
    buildCurrencyShortOption,
    getDecimalsForBaseCurrency,
    getNetworkReserve,
} from '@suite-common/wallet-utils';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import {
    type AmountLimitProps,
    validateCryptoLimits,
    validateDecimals,
    validateInteger,
    validateMin,
    validateNetworkReserve,
    validateReserveOrBalance,
} from 'src/utils/suite/validation';

type FiatInputRulesProps = {
    translationString: TranslationFunction;
    amountLimits: AmountLimitProps | undefined;
    selectedCurrencyCode: BaseCurrencyCode | '';
};

export const getFiatInputRules = ({
    translationString,
    amountLimits,
    selectedCurrencyCode,
}: FiatInputRulesProps): UseControllerProps['rules'] => {
    const fiatInputDecimals = getDecimalsForBaseCurrency({
        code: selectedCurrencyCode,
        isInSats: false,
    });
    const selectedCurrencyLabel =
        buildCurrencyShortOption({ currency: selectedCurrencyCode, areSatsDisplayed: false })
            .label ||
        amountLimits?.currency ||
        'USD';

    return {
        validate: {
            min: validateMin(translationString),
            decimals: validateDecimals(translationString, { decimals: fiatInputDecimals }),
            minFiat: (value: string) => {
                if (
                    value &&
                    amountLimits?.minFiat &&
                    new BigNumber(value).isLessThan(amountLimits.minFiat)
                ) {
                    return translationString('TR_BUY_VALIDATION_ERROR_MINIMUM_FIAT', {
                        minimum: new BigNumber(amountLimits.minFiat).toFixed(
                            fiatInputDecimals,
                            BigNumber.ROUND_HALF_UP,
                        ),
                        currency: selectedCurrencyLabel,
                    });
                }
            },
            maxFiat: (value: string) => {
                if (
                    value &&
                    amountLimits?.maxFiat &&
                    new BigNumber(value).isGreaterThan(amountLimits.maxFiat)
                ) {
                    return translationString('TR_BUY_VALIDATION_ERROR_MAXIMUM_FIAT', {
                        maximum: new BigNumber(amountLimits.maxFiat).toFixed(
                            fiatInputDecimals,
                            BigNumber.ROUND_HALF_UP,
                        ),
                        currency: selectedCurrencyLabel,
                    });
                }
            },
        },
    };
};

type CryptoInputRulesProps = {
    isBuyContext: boolean;
    translationString: TranslationFunction;
    shouldSendInSats: boolean | undefined;
    decimals: number;
    amountLimits: AmountLimitProps | undefined;
    formatter: Formatter<string, string>;
    validationAccount: Account;
    outputToken: string | null | undefined;
    isNetworkReserveEnabled: boolean;
    contractAddress: string | undefined;
    feeInUnits: string | undefined;
};

export const getCryptoInputRules = ({
    isBuyContext,
    translationString,
    shouldSendInSats,
    decimals,
    amountLimits,
    formatter,
    validationAccount,
    outputToken,
    isNetworkReserveEnabled,
    contractAddress,
    feeInUnits,
}: CryptoInputRulesProps): UseControllerProps['rules'] => ({
    validate: {
        min: validateMin(translationString),
        integer: validateInteger(translationString, { except: !shouldSendInSats }),
        decimals: validateDecimals(translationString, { decimals }),
        limits: validateCryptoLimits(translationString, {
            amountLimits,
            areSatsUsed: !!shouldSendInSats,
            formatter,
        }),
        ...(!isBuyContext
            ? {
                  reserveOrBalance: validateReserveOrBalance(translationString, {
                      account: validationAccount,
                      areSatsUsed: !!shouldSendInSats,
                      contractAddress: outputToken ?? undefined,
                  }),
                  networkReserve: isNetworkReserveEnabled
                      ? validateNetworkReserve(translationString, {
                            reserve: getNetworkReserve({
                                symbol: validationAccount.symbol,
                                contractAddress,
                                isEnabled: isNetworkReserveEnabled,
                            }),
                            balance: validationAccount.formattedBalance,
                            fee: feeInUnits,
                        })
                      : () => undefined,
              }
            : {}),
    },
});
