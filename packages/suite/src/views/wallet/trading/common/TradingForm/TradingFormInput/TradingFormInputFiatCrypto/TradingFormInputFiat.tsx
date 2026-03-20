import { useEffect } from 'react';
import {
    type FieldErrors,
    type UseControllerProps,
    useFormContext,
    useWatch,
} from 'react-hook-form';

import { useTranslation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import {
    TRADING_FORM_FIAT_CURRENCY_SELECT,
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_CURRENCY,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingBuyFormProps,
    getNetworkDecimalsWithFallback,
} from '@suite-common/trading';
import { formInputsMaxLength } from '@suite-common/validators';
import { selectCurrentFiatRates, selectIsNetworkReserveEnabled } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import {
    buildCurrencyShortOption,
    convertAmountSubunitsToUnits,
    findToken,
    getDecimalsForBaseCurrency,
    getFiatRateKey,
    getNetworkReserve,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { type BaseCurrencyCode, isFiatBaseCurrencyCode } from '@trezor/blockchain-link-types';
import { NumberInput } from '@trezor/product-components';
import { useDidUpdate } from '@trezor/react-utils';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';
import { useFiatFromCryptoValue } from 'src/hooks/suite/useFiatFromCryptoValue';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import {
    type TradingAllFormProps,
    type TradingFormInputFiatCryptoProps,
    type TradingSellExchangeFormProps,
} from 'src/types/trading/tradingForm';
import { validateDecimals, validateMin, validateNetworkReserve } from 'src/utils/suite/validation';
import {
    isTradingExchangeContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { getFeeInUnits } from 'src/utils/wallet/trading/tradingUtils';
import { TradingFormInputCurrency } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputCurrency';

export const TradingFormInputFiat = ({
    cryptoInputName,
    fiatInputName,
    labelLeft,
    labelRight,
}: TradingFormInputFiatCryptoProps) => {
    const { translationString } = useTranslation();
    const locale = useSelector(selectLanguage);
    const isNetworkReserveEnabled = useSelector(selectIsNetworkReserveEnabled);

    const context = useTradingFormContext();
    const { account, amountLimits } = context;
    const {
        control,
        formState: { errors },
        trigger,
        clearErrors,
    } = useFormContext<TradingAllFormProps>();

    const sendCryptoSelect = useWatch({
        control,
        name: TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    });
    const tokenAddress = sendCryptoSelect?.contractAddress as TokenAddress | undefined;

    const balance = tokenAddress
        ? findToken(account.tokens, tokenAddress)?.balance
        : account.formattedBalance;

    const { fiatAmount } = useFiatFromCryptoValue({
        amount: balance || '',
        symbol: account.symbol,
        tokenAddress,
        rateType: 'current',
    });

    const networkReserve = getNetworkReserve({
        symbol: account.symbol,
        contractAddress: tokenAddress,
        isEnabled: isNetworkReserveEnabled,
    });

    const { fiatAmount: networkReserveFiatAmount } = useFiatFromCryptoValue({
        amount: networkReserve || '',
        symbol: account.symbol,
        tokenAddress,
        rateType: 'current',
    });

    const feeInUnits =
        isTradingSellContext(context) || isTradingExchangeContext(context)
            ? getFeeInUnits({
                  symbol: account.symbol,
                  composedLevels: context.composedLevels,
                  selectedFee: context.composedTransactionInfo?.selectedFee,
              })
            : undefined;

    const { fiatAmount: feeFiatAmount } = useFiatFromCryptoValue({
        amount: feeInUnits?.toString() || '',
        symbol: account.symbol,
        tokenAddress,
        rateType: 'current',
    });

    const rates = useSelector(selectCurrentFiatRates);
    const outputCurrencySelect = useWatch({ control, name: TRADING_FORM_OUTPUT_CURRENCY });
    const fiatCurrencySelect = useWatch({ control, name: TRADING_FORM_FIAT_CURRENCY_SELECT });
    const cryptoAmount = useWatch({ control, name: cryptoInputName });
    const { areSatsDisplayed } = useBitcoinAmountUnit(account.symbol);
    const normalizedCryptoAmount =
        account.symbol === 'btc' && areSatsDisplayed && cryptoAmount
            ? convertAmountSubunitsToUnits(
                  cryptoAmount,
                  getNetworkDecimalsWithFallback(account.symbol),
              )
            : cryptoAmount;

    let selectedCurrencyCode: BaseCurrencyCode | '' = '';
    if (isFiatBaseCurrencyCode(outputCurrencySelect?.value)) {
        selectedCurrencyCode = outputCurrencySelect.value;
    } else if (isFiatBaseCurrencyCode(fiatCurrencySelect?.value)) {
        selectedCurrencyCode = fiatCurrencySelect.value;
    }
    const fiatInputDecimals = getDecimalsForBaseCurrency({
        code: selectedCurrencyCode,
        isInSats: false,
    });
    const selectedCurrencyLabel =
        buildCurrencyShortOption({
            currency: selectedCurrencyCode,
            areSatsDisplayed: false,
        }).label ||
        context.amountLimits?.currency ||
        'USD';

    const fiatInputError =
        fiatInputName === TRADING_FORM_OUTPUT_FIAT
            ? (errors as FieldErrors<TradingSellExchangeFormProps>)?.outputs?.[0]?.fiat
            : (errors as FieldErrors<TradingBuyFormProps>).fiatInput;
    const cryptoInputError =
        cryptoInputName === TRADING_FORM_OUTPUT_AMOUNT
            ? (errors as FieldErrors<TradingSellExchangeFormProps>)?.outputs?.[0]?.amount
            : undefined;

    const isNetworkReserveError =
        (isTradingExchangeContext(context) || isTradingSellContext(context)) &&
        fiatInputError?.type === 'networkReserve';
    const setShowReserveBanner =
        isTradingExchangeContext(context) || isTradingSellContext(context)
            ? context.setShowReserveBanner
            : undefined;

    useEffect(() => {
        setShowReserveBanner?.(isNetworkReserveError);
    }, [isNetworkReserveError, setShowReserveBanner]);

    const fiatInputRules: UseControllerProps['rules'] = {
        ...(isTradingExchangeContext(context)
            ? {
                  validate: {
                      min: validateMin(translationString),
                      decimals: validateDecimals(translationString, {
                          decimals: fiatInputDecimals,
                      }),
                      balance: (value: string) => {
                          const valueBigNumber = new BigNumber(value);
                          if (
                              fiatAmount &&
                              valueBigNumber.isGreaterThan(new BigNumber(fiatAmount))
                          ) {
                              return translationString('AMOUNT_IS_NOT_ENOUGH');
                          }
                      },
                      networkReserve: isNetworkReserveEnabled
                          ? validateNetworkReserve(translationString, {
                                reserve: networkReserveFiatAmount?.toString(),
                                balance: fiatAmount?.toString(),
                                fee: feeFiatAmount?.toString(),
                            })
                          : () => undefined,
                      minFiat: () => {
                          if (
                              normalizedCryptoAmount &&
                              context.amountLimits?.minCrypto &&
                              new BigNumber(normalizedCryptoAmount).isLessThan(
                                  new BigNumber(context.amountLimits.minCrypto),
                              )
                          ) {
                              const fiatRateKey = getFiatRateKey(
                                  account.symbol,
                                  selectedCurrencyCode || 'usd',
                                  tokenAddress,
                              );
                              const rate =
                                  rates && rates[fiatRateKey] ? rates[fiatRateKey].rate : undefined;
                              const minFiat = toFiatCurrency({
                                  amount: context.amountLimits.minCrypto,
                                  rate,
                              })?.toString();

                              if (minFiat) {
                                  return translationString('TR_BUY_VALIDATION_ERROR_MINIMUM_FIAT', {
                                      minimum: new BigNumber(minFiat).toFixed(
                                          fiatInputDecimals,
                                          BigNumber.ROUND_HALF_UP,
                                      ),
                                      currency: selectedCurrencyLabel,
                                  });
                              } else {
                                  return translationString('TR_BUY_VALIDATION_ERROR_MINIMUM_FIAT', {
                                      minimum: context.amountLimits.minCrypto,
                                      currency: selectedCurrencyLabel,
                                  });
                              }
                          }
                      },
                  },
              }
            : {
                  validate: {
                      min: validateMin(translationString),
                      decimals: validateDecimals(translationString, {
                          decimals: fiatInputDecimals,
                      }),
                      ...(isTradingSellContext(context)
                          ? {
                                networkReserve: isNetworkReserveEnabled
                                    ? validateNetworkReserve(translationString, {
                                          reserve: networkReserveFiatAmount?.toString(),
                                          balance: fiatAmount?.toString(),
                                          fee: feeFiatAmount?.toString(),
                                      })
                                    : () => undefined,
                            }
                          : {}),
                      minFiat: (value: string) => {
                          if (
                              value &&
                              context.amountLimits?.minFiat &&
                              new BigNumber(value).isLessThan(
                                  new BigNumber(context.amountLimits.minFiat),
                              )
                          ) {
                              return translationString('TR_BUY_VALIDATION_ERROR_MINIMUM_FIAT', {
                                  minimum: new BigNumber(context.amountLimits.minFiat).toFixed(
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
                              context.amountLimits?.maxFiat &&
                              new BigNumber(value).isGreaterThan(
                                  new BigNumber(context.amountLimits.maxFiat),
                              )
                          ) {
                              return translationString('TR_BUY_VALIDATION_ERROR_MAXIMUM_FIAT', {
                                  maximum: new BigNumber(context.amountLimits.maxFiat).toFixed(
                                      fiatInputDecimals,
                                      BigNumber.ROUND_HALF_UP,
                                  ),
                                  currency: selectedCurrencyLabel,
                              });
                          }
                      },
                  },
              }),
    };

    useDidUpdate(() => {
        if (amountLimits) {
            trigger(fiatInputName);
        }
    }, [amountLimits, fiatInputName, trigger]);

    return (
        <NumberInput
            name={fiatInputName}
            locale={locale}
            labelLeft={labelLeft}
            labelRight={labelRight}
            onChange={() => {
                if (isTradingSellContext(context)) {
                    context.form.helpers.setFractionButton(undefined);
                }
                if (isTradingExchangeContext(context)) {
                    context.form.helpers.setFractionButton(undefined);
                    context.resetSelectedOffer();
                }

                clearErrors(cryptoInputName);
            }}
            hasError={!!(fiatInputError ?? cryptoInputError)}
            control={control}
            rules={fiatInputRules}
            maxLength={formInputsMaxLength.amount}
            bottomText={fiatInputError?.message ?? cryptoInputError?.message ?? null}
            rightContent={<TradingFormInputCurrency isClean width={70} />}
            data-testid="@trading/form/fiat-input"
        />
    );
};
