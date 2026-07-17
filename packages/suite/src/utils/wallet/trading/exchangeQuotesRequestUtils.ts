import { type TradingExchangeFormProps } from '@suite-common/trading';

export const isExchangeQuotesFetchAllowed = (values: TradingExchangeFormProps): boolean => {
    if (!values.sendCryptoSelect?.id || !values.receiveCryptoSelect?.id) {
        return false;
    }

    const amount = values.outputs?.[0]?.amount;

    return !!amount && parseFloat(amount) > 0;
};
