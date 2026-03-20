import { useEffect } from 'react';
import { type FieldErrors, type UseFormReturn } from 'react-hook-form';

import { useTranslation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { useFormatters } from '@suite-common/formatters';
import {
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_MAX,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingBuyFormProps,
    getNetworkDecimalsWithFallback,
    useTradingUtils,
} from '@suite-common/trading';
import { formInputsMaxLength } from '@suite-common/validators';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { selectIsNetworkReserveEnabled } from '@suite-common/wallet-core';
import { getNetworkReserve } from '@suite-common/wallet-utils';
import { NumberInput } from '@trezor/product-components';
import { useDidUpdate } from '@trezor/react-utils';

import { useSelector } from 'src/hooks/suite';
import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import {
    type TradingAllFormProps,
    type TradingFormInputFiatCryptoProps,
    type TradingSellExchangeFormProps,
} from 'src/types/trading/tradingForm';
import {
    validateCryptoLimits,
    validateDecimals,
    validateInteger,
    validateMin,
    validateNetworkReserve,
    validateReserveOrBalance,
} from 'src/utils/suite/validation';
import {
    isTradingBuyContext,
    isTradingExchangeContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { getFeeInUnits, tradingGetAccountLabel } from 'src/utils/wallet/trading/tradingUtils';

export const TradingFormInputCryptoAmount = ({
    cryptoInputName,
    fiatInputName,
    cryptoSelectName,
    labelLeft,
    labelRight,
}: TradingFormInputFiatCryptoProps) => {
    const { translationString } = useTranslation();
    const { CryptoAmountFormatter } = useFormatters();
    const locale = useSelector(selectLanguage);
    const isNetworkReserveEnabled = useSelector(selectIsNetworkReserveEnabled);

    const context = useTradingFormContext();
    const { amountLimits, account, network } = context;

    const feeInUnits =
        isTradingSellContext(context) || isTradingExchangeContext(context)
            ? getFeeInUnits({
                  symbol: account.symbol,
                  composedLevels: context.composedLevels,
                  selectedFee: context.composedTransactionInfo?.selectedFee,
              })
            : undefined;

    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const { cryptoIdToSymbolAndContractAddress } = useTradingUtils();
    const {
        control,
        formState: { errors },
        getValues,
        trigger,
        clearErrors,
    } = useTradingFormContext() as UseFormReturn<TradingAllFormProps>;

    const cryptoSelect = getValues(cryptoSelectName);
    const cryptoInputError =
        cryptoInputName === TRADING_FORM_OUTPUT_AMOUNT
            ? (errors as FieldErrors<TradingSellExchangeFormProps>)?.outputs?.[0]?.amount
            : (errors as FieldErrors<TradingBuyFormProps>).cryptoInput;

    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(cryptoSelect?.id);
    const displaySymbol = tradingGetAccountLabel(
        getDisplaySymbol(coinSymbol ?? '', contractAddress),
        shouldSendInSats,
    );
    const { getAssetDecimals } = useTradingAssetDecimals();
    const decimals = isTradingBuyContext(context)
        ? getNetworkDecimalsWithFallback(network.symbol)
        : getAssetDecimals({
              accountKey: getValues(TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT)?.accountKey,
              cryptoId: cryptoSelect?.id,
          });

    const isNetworkReserveError =
        (isTradingExchangeContext(context) || isTradingSellContext(context)) &&
        cryptoInputError?.type === 'networkReserve';
    const setShowReserveBanner =
        isTradingExchangeContext(context) || isTradingSellContext(context)
            ? context.setShowReserveBanner
            : undefined;

    useEffect(() => {
        setShowReserveBanner?.(isNetworkReserveError);
    }, [isNetworkReserveError, setShowReserveBanner]);

    const cryptoInputRules = {
        validate: {
            min: validateMin(translationString),
            integer: validateInteger(translationString, { except: !shouldSendInSats }),
            decimals: validateDecimals(translationString, { decimals }),
            limits: validateCryptoLimits(translationString, {
                amountLimits,
                areSatsUsed: !!shouldSendInSats,
                formatter: CryptoAmountFormatter,
            }),
            ...(!isTradingBuyContext(context)
                ? {
                      reserveOrBalance: validateReserveOrBalance(translationString, {
                          account,
                          areSatsUsed: !!shouldSendInSats,
                          contractAddress: getValues('outputs')?.[0]?.token,
                      }),
                      networkReserve: isNetworkReserveEnabled
                          ? validateNetworkReserve(translationString, {
                                reserve: getNetworkReserve({
                                    symbol: account.symbol,
                                    contractAddress,
                                    isEnabled: isNetworkReserveEnabled,
                                }),
                                balance: account.formattedBalance,
                                fee: feeInUnits?.toString(),
                            })
                          : () => undefined,
                  }
                : {}),
        },
    };

    useDidUpdate(() => {
        if (amountLimits) {
            trigger([cryptoInputName]);
        }
    }, [amountLimits, trigger]);

    return (
        <NumberInput
            name={cryptoInputName}
            locale={locale}
            labelLeft={labelLeft}
            labelRight={labelRight}
            onChange={() => {
                if (isTradingSellContext(context)) {
                    context.setValue(TRADING_FORM_OUTPUT_MAX, undefined, { shouldDirty: true });
                    context.form.helpers.setFractionButton(undefined);
                }
                if (isTradingExchangeContext(context)) {
                    context.setValue(TRADING_FORM_OUTPUT_MAX, undefined, { shouldDirty: true });
                    context.form.helpers.setFractionButton(undefined);
                    context.resetSelectedOffer();
                }

                clearErrors(fiatInputName);
            }}
            hasError={!!cryptoInputError}
            control={control}
            rules={cryptoInputRules}
            maxLength={formInputsMaxLength.amount}
            bottomText={cryptoInputError?.message || null}
            rightContent={<>{displaySymbol}</>}
            data-testid="@trading/form/crypto-input"
        />
    );
};
