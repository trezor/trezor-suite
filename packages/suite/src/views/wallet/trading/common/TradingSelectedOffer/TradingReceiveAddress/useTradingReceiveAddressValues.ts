import { type CoinExtraField, type CryptoId } from 'invity-api';

import { type TradingTradeBuyExchangeType } from '@suite-common/trading';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { type useTradingReceiveAddress } from 'src/hooks/wallet/trading/form/useTradingReceiveAddress';
import { isTradingExchangeContext } from 'src/utils/wallet/trading/tradingTypingUtils';
import { useTradingSelectedQuote } from 'src/views/wallet/trading/common/hooks/useTradingSelectedQuote';

type TradingReceiveAddressValues = {
    cryptoId: CryptoId;
    tradingReceiveAddress: ReturnType<typeof useTradingReceiveAddress>;
    extraFieldDescription: CoinExtraField | undefined;
};

export const useTradingReceiveAddressValues = (): TradingReceiveAddressValues => {
    // React Compiler: `getValues` keeps one identity for the form's whole life, so a compiled
    // render-time read of it freezes on the first render. Remove once these reads move to
    // `useWatch` or out of render.
    'use no memo';

    const context = useTradingFormContext<TradingTradeBuyExchangeType>();
    const { tradingReceiveAddress } = context;
    const quote = useTradingSelectedQuote(context.type);

    const cryptoId = isTradingExchangeContext(context)
        ? context.getValues().receiveCryptoSelect?.id
        : context.getValues().cryptoSelect?.id;

    if (!cryptoId) {
        throw new Error('cryptoId must be defined');
    }

    const extraFieldDescription =
        isTradingExchangeContext(context) && quote && 'extraFieldDescription' in quote
            ? quote.extraFieldDescription
            : undefined;

    return { cryptoId, tradingReceiveAddress, extraFieldDescription };
};
