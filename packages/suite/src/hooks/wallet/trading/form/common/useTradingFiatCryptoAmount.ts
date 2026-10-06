import { useState } from 'react';
import { type UseFormReturn } from 'react-hook-form';

import { TRADING_FORM_OUTPUT_MAX } from '@suite-common/trading';

import { type TradingSellExchangeFormProps } from 'src/types/trading/tradingForm';

type UseTradingFiatCryptoAmountProps<T extends TradingSellExchangeFormProps> = {
    methods: UseFormReturn<T>;
};

/**
 * Fraction-button state shared by the sell and exchange form-input hooks.
 */
export const useTradingFiatCryptoAmount = <T extends TradingSellExchangeFormProps>({
    methods,
}: UseTradingFiatCryptoAmountProps<T>) => {
    const { setValue } = methods as unknown as UseFormReturn<TradingSellExchangeFormProps>;

    const [fractionButtonState, setFractionButtonState] = useState<number | undefined>(undefined);

    const setFractionButton = (fraction: number | undefined) => {
        if (fraction !== 1) {
            setValue(TRADING_FORM_OUTPUT_MAX, undefined, { shouldDirty: true });
        }

        setFractionButtonState(fraction);
    };

    const onFiatCurrencyChange = () => {
        setFractionButton(undefined);
    };

    return {
        fractionButton: fractionButtonState,
        setFractionButton,
        onFiatCurrencyChange,
    };
};
