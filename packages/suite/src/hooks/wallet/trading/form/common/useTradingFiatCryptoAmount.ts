import { useCallback, useEffect, useRef, useState } from 'react';
import { type UseFormReturn, useWatch } from 'react-hook-form';

import { type FiatCurrencyCode } from 'invity-api';

import {
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_CURRENCY,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_OUTPUT_MAX,
    type TradingFiatRatesReturn,
    mapFiatCurrencyCodeToBaseCurrencyCode,
} from '@suite-common/trading';
import {
    asAmountSubunit,
    getDecimalsForBaseCurrency,
    subunitsToUnits,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { type TradingSellExchangeFormProps } from 'src/types/trading/tradingForm';
import { calcCryptoFromFiat } from 'src/utils/wallet/trading/sellExchangeAmountUtils';

interface UseTradingFiatCryptoAmountProps<T extends TradingSellExchangeFormProps> {
    methods: UseFormReturn<T>;
    tradingFiatValues: TradingFiatRatesReturn | null;
    networkDecimals: number;
    shouldSendInSats: boolean | undefined;
}

/**
 * Amount-conversion cluster shared by the sell and exchange form-input hooks:
 * the fraction-button state, fiat↔crypto conversion handlers and the
 * fiat→crypto recalculation (skipped while a fraction button is active).
 */
export const useTradingFiatCryptoAmount = <T extends TradingSellExchangeFormProps>({
    methods,
    tradingFiatValues,
    networkDecimals,
    shouldSendInSats,
}: UseTradingFiatCryptoAmountProps<T>) => {
    const { getValues, setValue, control } =
        methods as unknown as UseFormReturn<TradingSellExchangeFormProps>;

    const [fractionButtonState, setFractionButtonState] = useState<number | undefined>(undefined);

    const watchedFiat = useWatch({ control, name: TRADING_FORM_OUTPUT_FIAT });
    const previousFiatRef = useRef(watchedFiat);

    const setFractionButton = (fraction: number | undefined) => {
        if (fraction !== 1) {
            setValue(TRADING_FORM_OUTPUT_MAX, undefined, { shouldDirty: true });
        }

        setFractionButtonState(fraction);
    };

    // on manual change of fiat currency, recalculate the fiat amount from the crypto amount
    const onFiatCurrencyChange = async (value: FiatCurrencyCode) => {
        setFractionButton(undefined);

        if (!tradingFiatValues) return;

        const mappedBaseCurrencyCode = mapFiatCurrencyCodeToBaseCurrencyCode(value);
        if (!mappedBaseCurrencyCode) return;

        const rate = await tradingFiatValues.fiatRatesUpdater(mappedBaseCurrencyCode);
        const amount = getValues(TRADING_FORM_OUTPUT_AMOUNT);
        const formattedAmount = shouldSendInSats
            ? subunitsToUnits({
                  value: asAmountSubunit(new BigNumber(amount)),
                  decimals: networkDecimals,
              })
            : new BigNumber(amount);

        if (
            rate?.rate &&
            formattedAmount &&
            !formattedAmount.isNaN() &&
            formattedAmount.gt(0) // formatAmount() returns '-1' on error
        ) {
            const fiatValueBigNumber = formattedAmount.multipliedBy(rate.rate);
            const fiatDecimals = getDecimalsForBaseCurrency({
                code: mappedBaseCurrencyCode,
                isInSats: false,
            });

            setValue(TRADING_FORM_OUTPUT_FIAT, fiatValueBigNumber.toFixed(fiatDecimals), {
                shouldValidate: true,
            });
        }
    };

    // recalculate the crypto amount from the fiat amount
    const calculateCryptoAmountFromFiat = useCallback(
        (fiatAmount: string | undefined) => {
            if (!fiatAmount) {
                setValue(TRADING_FORM_OUTPUT_AMOUNT, '', { shouldValidate: true });

                return;
            }

            const fiatCurrency = getValues(TRADING_FORM_OUTPUT_CURRENCY);

            if (!tradingFiatValues || !fiatCurrency) {
                return;
            }

            const cryptoAmount = calcCryptoFromFiat({
                fiatAmount,
                rate: tradingFiatValues.fiatRate?.rate,
                networkDecimals,
                shouldSendInSats,
            });

            setValue(TRADING_FORM_OUTPUT_AMOUNT, cryptoAmount, { shouldValidate: true });
        },
        [getValues, tradingFiatValues, networkDecimals, shouldSendInSats, setValue],
    );

    useEffect(() => {
        const currentFiat = getValues(TRADING_FORM_OUTPUT_FIAT);
        const hasFiatChanged = currentFiat !== previousFiatRef.current;
        previousFiatRef.current = currentFiat;

        if (hasFiatChanged && fractionButtonState === undefined) {
            calculateCryptoAmountFromFiat(currentFiat);
        }
    }, [watchedFiat, fractionButtonState, getValues, calculateCryptoAmountFromFiat]);

    return {
        fractionButton: fractionButtonState,
        setFractionButton,
        onFiatCurrencyChange,
    };
};
