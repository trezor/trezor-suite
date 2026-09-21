import { useCallback, useMemo } from 'react';
import { type FieldErrors, useFormContext, useWatch } from 'react-hook-form';

import { useTranslation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import {
    TRADING_FORM_FIAT_CURRENCY_SELECT,
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_CURRENCY,
    TRADING_FORM_OUTPUT_FIAT,
    type TradingBuyFormProps,
} from '@suite-common/trading';
import { formInputsMaxLength } from '@suite-common/validators';
import { type BaseCurrencyCode, isFiatBaseCurrencyCode } from '@trezor/blockchain-link-types';
import { NumberInput } from '@trezor/product-components';
import { useDidUpdate } from '@trezor/react-utils';

import { useSelector } from 'src/hooks/suite';
import { useSelectedTradingAsset } from 'src/hooks/wallet/trading/form/common/useSelectedTradingAsset';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    type TradingAllFormProps,
    type TradingFormInputFiatCryptoProps,
    type TradingSellExchangeFormProps,
} from 'src/types/trading/tradingForm';
import { isTradingExchangeOrSellContext } from 'src/utils/wallet/trading/tradingTypingUtils';
import { TradingFormInputCurrency } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputCurrency';

import { TradingFormInputAmountPlaceholder } from './TradingFormInputAmountPlaceholder';
import { getFiatInputRules } from './tradingFormInputFiatCryptoRules';

const TradingFormInputFiatContent = ({
    cryptoInputName,
    fiatInputName,
    labelLeft,
    labelRight,
}: TradingFormInputFiatCryptoProps) => {
    const { translationString } = useTranslation();
    const locale = useSelector(selectLanguage);

    const context = useTradingFormContext();
    const { amountLimits } = context;
    const {
        control,
        formState: { errors },
        trigger,
        clearErrors,
    } = useFormContext<TradingAllFormProps>();

    const outputCurrencySelect = useWatch({ control, name: TRADING_FORM_OUTPUT_CURRENCY });
    const fiatCurrencySelect = useWatch({ control, name: TRADING_FORM_FIAT_CURRENCY_SELECT });

    const setFractionButton = isTradingExchangeOrSellContext(context)
        ? context.form.helpers.setFractionButton
        : undefined;

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
        clearErrors(cryptoInputName);
    }, [setFractionButton, clearErrors, cryptoInputName]);

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

export const TradingFormInputFiat = (props: TradingFormInputFiatCryptoProps) => {
    const { type } = useTradingFormContext();
    const asset = useSelectedTradingAsset(type);

    if (!asset) {
        return (
            <TradingFormInputAmountPlaceholder
                name={props.fiatInputName}
                labelLeft={props.labelLeft}
                labelRight={props.labelRight}
            />
        );
    }

    return <TradingFormInputFiatContent {...props} />;
};
