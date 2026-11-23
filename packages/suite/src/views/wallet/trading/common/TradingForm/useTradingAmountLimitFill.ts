import { type UseFormReturn, useWatch } from 'react-hook-form';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import {
    TRADING_FORM_AMOUNT_INPUT_SOURCE,
    TRADING_FORM_AMOUNT_IN_CRYPTO,
} from '@suite-common/trading';
import { useServices } from '@trezor/dependency-injection';

import { useTradingFormContext } from '#src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    type TradingAllFormProps,
    type TradingFormInputFiatCryptoProps,
} from '#src/types/trading/tradingForm';
import { isTradingExchangeOrSellContext } from '#src/utils/wallet/trading/tradingTypingUtils';

import { getTradingAmountLimit } from './tradingAmountLimitUtils';

const ANALYTICS_TRADE_TYPES = { buy: 'buy', sell: 'sell', exchange: 'swap' } as const;

type UseTradingAmountLimitFillParams = Pick<
    TradingFormInputFiatCryptoProps,
    'cryptoInputName' | 'fiatInputName'
> & {
    errorType: string | undefined;
    isInSats: boolean | undefined;
    cryptoDecimals: number;
};

export const useTradingAmountLimitFill = ({
    errorType,
    cryptoInputName,
    fiatInputName,
    isInSats,
    cryptoDecimals,
}: UseTradingAmountLimitFillParams) => {
    const context = useTradingFormContext();
    const { analytics } = useServices(injectDesktopAnalytics);
    const { control, getValues, setValue, clearErrors } =
        context as UseFormReturn<TradingAllFormProps>;
    const cryptoAmount = useWatch({ control, name: cryptoInputName });

    const amountLimit = getTradingAmountLimit({
        errorType,
        cryptoAmount,
        amountLimits: context.amountLimits,
        isInSats: !!isInSats,
        cryptoDecimals,
    });

    if (!amountLimit) {
        return undefined;
    }

    const { limit, amountType, amount } = amountLimit;
    const isCryptoAmount = amountType === 'crypto';
    const filledInputName = isCryptoAmount ? cryptoInputName : fiatInputName;
    const clearedInputName = isCryptoAmount ? fiatInputName : cryptoInputName;
    const setFractionButton = isTradingExchangeOrSellContext(context)
        ? context.form.helpers.setFractionButton
        : undefined;

    return () => {
        analytics.report({
            type: events.tradingAmountLimitFillEvent.name,
            payload: { type: ANALYTICS_TRADE_TYPES[context.type], limit, amountType },
        });

        setValue(TRADING_FORM_AMOUNT_INPUT_SOURCE, amountType);
        setFractionButton?.(undefined);

        if (getValues(TRADING_FORM_AMOUNT_IN_CRYPTO) !== isCryptoAmount) {
            setValue(TRADING_FORM_AMOUNT_IN_CRYPTO, isCryptoAmount, { shouldDirty: true });
        }

        if (getValues(clearedInputName)) {
            setValue(clearedInputName, '', { shouldDirty: true });
        }

        clearErrors(clearedInputName);
        setValue(filledInputName, amount, { shouldValidate: true, shouldDirty: true });
    };
};
