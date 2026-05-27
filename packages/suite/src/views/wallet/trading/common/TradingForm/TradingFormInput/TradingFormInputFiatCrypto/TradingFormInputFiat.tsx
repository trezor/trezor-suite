import { useCallback, useEffect, useMemo } from 'react';
import { type FieldErrors, useFormContext, useWatch } from 'react-hook-form';

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
    convertAmountSubunitsToUnits,
    findToken,
    getNetworkReserve,
} from '@suite-common/wallet-utils';
import { type BaseCurrencyCode, isFiatBaseCurrencyCode } from '@trezor/blockchain-link-types';
import { NumberInput } from '@trezor/product-components';
import { useDidUpdate } from '@trezor/react-utils';

import { useSelector } from 'src/hooks/suite';
import { useFiatFromCryptoValue } from 'src/hooks/suite/useFiatFromCryptoValue';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import {
    type TradingAllFormProps,
    type TradingFormInputFiatCryptoProps,
    type TradingSellExchangeFormProps,
} from 'src/types/trading/tradingForm';
import {
    isTradingExchangeContext,
    isTradingExchangeOrSellContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { getFeeInUnits } from 'src/utils/wallet/trading/tradingUtils';
import { TradingFormInputCurrency } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputCurrency';

import { getFiatInputRules } from './tradingFormInputFiatCryptoRules';

export const TradingFormInputFiat = ({
    cryptoInputName,
    fiatInputName,
    labelLeft,
    labelRight,
}: TradingFormInputFiatCryptoProps) => {
    const { translationString } = useTranslation();
    const locale = useSelector(selectLanguage);
    const isNetworkReserveEnabled = useSelector(selectIsNetworkReserveEnabled);
    const rates = useSelector(selectCurrentFiatRates);

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
    const outputCurrencySelect = useWatch({ control, name: TRADING_FORM_OUTPUT_CURRENCY });
    const fiatCurrencySelect = useWatch({ control, name: TRADING_FORM_FIAT_CURRENCY_SELECT });
    const cryptoAmount = useWatch({ control, name: cryptoInputName });
    const { areSatsDisplayed } = useBitcoinAmountUnit(account.symbol);

    const isExchangeContext = isTradingExchangeContext(context);
    const isSellContext = isTradingSellContext(context);
    const isExchangeOrSellContext = isTradingExchangeOrSellContext(context);
    const setShowReserveBanner = isExchangeOrSellContext ? context.setShowReserveBanner : undefined;
    const setFractionButton = isExchangeOrSellContext
        ? context.form.helpers.setFractionButton
        : undefined;
    const handleResetSelectedOffer = isExchangeContext ? context.resetSelectedOffer : undefined;

    const tokenAddress = (sendCryptoSelect?.contractAddress ?? undefined) as
        | TokenAddress
        | undefined;
    const balance = tokenAddress
        ? findToken(account.tokens, tokenAddress)?.balance
        : account.formattedBalance;
    const networkReserve = getNetworkReserve({
        symbol: account.symbol,
        contractAddress: tokenAddress,
        isEnabled: isNetworkReserveEnabled,
    });
    const feeInUnits = isExchangeOrSellContext
        ? getFeeInUnits({
              symbol: account.symbol,
              composedLevels: context.composedLevels,
              selectedFee: context.composedTransactionInfo?.selectedFee,
          })
        : undefined;

    const { fiatAmount } = useFiatFromCryptoValue({
        amount: balance || '',
        symbol: account.symbol,
        tokenAddress,
        rateType: 'current',
    });
    const { fiatAmount: networkReserveFiatAmount } = useFiatFromCryptoValue({
        amount: networkReserve || '',
        symbol: account.symbol,
        tokenAddress,
        rateType: 'current',
    });
    const { fiatAmount: feeFiatAmount } = useFiatFromCryptoValue({
        amount: feeInUnits?.toString() || '',
        symbol: account.symbol,
        tokenAddress,
        rateType: 'current',
    });

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

    const fiatInputError =
        fiatInputName === TRADING_FORM_OUTPUT_FIAT
            ? (errors as FieldErrors<TradingSellExchangeFormProps>)?.outputs?.[0]?.fiat
            : (errors as FieldErrors<TradingBuyFormProps>).fiatInput;
    const cryptoInputError =
        cryptoInputName === TRADING_FORM_OUTPUT_AMOUNT
            ? (errors as FieldErrors<TradingSellExchangeFormProps>)?.outputs?.[0]?.amount
            : undefined;
    const isNetworkReserveError =
        isExchangeOrSellContext && fiatInputError?.type === 'networkReserve';

    const fiatInputRules = useMemo(
        () =>
            getFiatInputRules({
                isExchangeContext,
                isSellContext,
                translationString,
                fiatAmount,
                isNetworkReserveEnabled,
                networkReserveFiatAmount,
                feeFiatAmount,
                normalizedCryptoAmount,
                amountLimits,
                accountSymbol: account.symbol,
                selectedCurrencyCode,
                tokenAddress,
                rates,
            }),
        [
            isExchangeContext,
            isSellContext,
            amountLimits,
            translationString,
            isNetworkReserveEnabled,
            networkReserveFiatAmount,
            fiatAmount,
            feeFiatAmount,
            normalizedCryptoAmount,
            account.symbol,
            selectedCurrencyCode,
            tokenAddress,
            rates,
        ],
    );

    const handleChange = useCallback(() => {
        setFractionButton?.(undefined);
        handleResetSelectedOffer?.();
        clearErrors(cryptoInputName);
    }, [setFractionButton, handleResetSelectedOffer, clearErrors, cryptoInputName]);

    useEffect(() => {
        setShowReserveBanner?.(isNetworkReserveError);
    }, [isNetworkReserveError, setShowReserveBanner]);

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
            onChange={handleChange}
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
