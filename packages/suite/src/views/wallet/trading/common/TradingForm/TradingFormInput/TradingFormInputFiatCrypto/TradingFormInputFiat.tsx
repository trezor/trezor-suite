import { useCallback, useEffect, useMemo } from 'react';
import { type FieldErrors, useFormContext, useWatch } from 'react-hook-form';

import { useTheme } from 'styled-components';

import { useTranslation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import {
    TRADING_FORM_AMOUNT_IN_CRYPTO,
    TRADING_FORM_FIAT_CURRENCY_SELECT,
    TRADING_FORM_OUTPUT_CURRENCY,
    TRADING_FORM_OUTPUT_FIAT,
    type TradingBuyFormProps,
} from '@suite-common/trading';
import { formInputsMaxLength } from '@suite-common/validators';
import { getDecimalsForBaseCurrency } from '@suite-common/wallet-utils';
import { type BaseCurrencyCode, isFiatBaseCurrencyCode } from '@trezor/blockchain-link-types';
import { Skeleton } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';
import { useDidUpdate } from '@trezor/react-utils';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';
import { useSelectedTradingAsset } from 'src/hooks/wallet/trading/form/common/useSelectedTradingAsset';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    type TradingAllFormProps,
    type TradingFormInputFiatCryptoProps,
    type TradingSellExchangeFormProps,
} from 'src/types/trading/tradingForm';
import { isTradingExchangeOrSellContext } from 'src/utils/wallet/trading/tradingTypingUtils';
import { useTradingQuoteAmounts } from 'src/views/wallet/trading/common/hooks/useTradingQuoteAmounts';
import { useTradingSelectedQuote } from 'src/views/wallet/trading/common/hooks/useTradingSelectedQuote';

import { TradingFormInputAmountPlaceholder } from './TradingFormInputAmountPlaceholder';
import { getFiatInputRules } from './tradingFormInputFiatCryptoRules';
import {
    TRADING_AMOUNT_HEIGHT,
    TRADING_AMOUNT_PLACEHOLDER,
    TRADING_AMOUNT_SKELETON_WIDTH,
    getTradingAmountInputStyle,
} from '../../tradingFormInputsUtils';

const TradingFormInputFiatContent = ({
    cryptoInputName,
    fiatInputName,
}: TradingFormInputFiatCryptoProps) => {
    const { translationString } = useTranslation();
    const theme = useTheme();
    const locale = useSelector(selectLanguage);

    const context = useTradingFormContext();
    const { type, amountLimits } = context;
    const {
        control,
        formState: { errors },
        getValues,
        setValue,
        trigger,
        clearErrors,
    } = useFormContext<TradingAllFormProps>();

    const outputCurrencySelect = useWatch({ control, name: TRADING_FORM_OUTPUT_CURRENCY });
    const fiatCurrencySelect = useWatch({ control, name: TRADING_FORM_FIAT_CURRENCY_SELECT });
    const amountInCrypto = useWatch({ control, name: TRADING_FORM_AMOUNT_IN_CRYPTO });
    const fiatAmount = useWatch({ control, name: fiatInputName });

    const setFractionButton = isTradingExchangeOrSellContext(context)
        ? context.form.helpers.setFractionButton
        : undefined;

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

    const fiatInputError =
        fiatInputName === TRADING_FORM_OUTPUT_FIAT
            ? (errors as FieldErrors<TradingSellExchangeFormProps>)?.outputs?.[0]?.fiat
            : (errors as FieldErrors<TradingBuyFormProps>).fiatInput;

    const fiatInputRules = useMemo(
        () =>
            getFiatInputRules({
                translationString,
                amountLimits,
                selectedCurrencyCode,
            }),
        [translationString, amountLimits, selectedCurrencyCode],
    );

    const handleChange = useCallback(() => {
        setFractionButton?.(undefined);

        if (getValues(TRADING_FORM_AMOUNT_IN_CRYPTO)) {
            setValue(TRADING_FORM_AMOUNT_IN_CRYPTO, false, { shouldDirty: true });
        }

        if (getValues(cryptoInputName)) {
            setValue(cryptoInputName, '', { shouldDirty: true });
        }

        clearErrors(cryptoInputName);
    }, [setFractionButton, getValues, setValue, clearErrors, cryptoInputName]);

    const selectedQuote = useTradingSelectedQuote(type);
    const quoteAmounts = useTradingQuoteAmounts(selectedQuote, type);
    const quoteFiatAmount = quoteAmounts?.amountInCrypto ? quoteAmounts.sendAmount : undefined;

    useEffect(() => {
        if (
            !quoteFiatAmount ||
            !getValues(TRADING_FORM_AMOUNT_IN_CRYPTO) ||
            !getValues(cryptoInputName)
        ) {
            return;
        }

        const roundedFiatAmount = new BigNumber(quoteFiatAmount).toFixed(fiatInputDecimals);

        if (roundedFiatAmount === getValues(fiatInputName)) {
            return;
        }

        setValue(fiatInputName, roundedFiatAmount, { shouldValidate: true, shouldDirty: true });
    }, [
        quoteFiatAmount,
        amountInCrypto,
        cryptoInputName,
        fiatInputName,
        fiatInputDecimals,
        getValues,
        setValue,
    ]);

    useDidUpdate(() => {
        if (amountLimits) {
            trigger(fiatInputName);
        }
    }, [amountLimits, fiatInputName, trigger]);

    const isDerivedAmountLoading = !!amountInCrypto && context.form.state.isFormLoading;

    return (
        <NumberInput
            isClean
            flex="1"
            name={fiatInputName}
            placeholder={TRADING_AMOUNT_PLACEHOLDER}
            style={{
                ...getTradingAmountInputStyle(fiatAmount),
                color: fiatInputError ? theme.contentCritical : undefined,
                visibility: isDerivedAmountLoading ? 'hidden' : undefined,
            }}
            leftContent={
                isDerivedAmountLoading ? (
                    <Skeleton
                        animate
                        width={TRADING_AMOUNT_SKELETON_WIDTH}
                        height={TRADING_AMOUNT_HEIGHT}
                    />
                ) : undefined
            }
            locale={locale}
            onChange={handleChange}
            hasError={!!fiatInputError}
            isDisabled={isDerivedAmountLoading}
            control={control}
            rules={fiatInputRules}
            maxLength={formInputsMaxLength.amount}
            data-testid="@trading/form/fiat-input"
        />
    );
};

export const TradingFormInputFiat = (props: TradingFormInputFiatCryptoProps) => {
    const { type } = useTradingFormContext();
    const asset = useSelectedTradingAsset(type);

    if (!asset) {
        return <TradingFormInputAmountPlaceholder name={props.fiatInputName} />;
    }

    return <TradingFormInputFiatContent {...props} />;
};
