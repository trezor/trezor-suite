import { TRADING_FORM_OUTPUT_AMOUNT, type TradingExchangeFormProps } from '@suite-common/trading';

export const getExchangeActiveAmountField = (): typeof TRADING_FORM_OUTPUT_AMOUNT =>
    TRADING_FORM_OUTPUT_AMOUNT;

export const getExchangeActiveAmount = (values: TradingExchangeFormProps): string | undefined =>
    values.outputs?.[0]?.amount;

export const isExchangeQuotesFetchAllowed = (values: TradingExchangeFormProps): boolean => {
    if (!values.sendCryptoSelect?.id || !values.receiveCryptoSelect?.id) {
        return false;
    }

    const amount = getExchangeActiveAmount(values);

    return !!amount && parseFloat(amount) > 0;
};
