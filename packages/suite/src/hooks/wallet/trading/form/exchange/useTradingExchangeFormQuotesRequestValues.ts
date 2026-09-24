import { type ExchangeTrade, type ExchangeTradeQuoteRequest } from 'invity-api';

import {
    TRADING_EXCHANGE_FORM,
    TRADING_EXCHANGE_FORM_CEX,
    TRADING_EXCHANGE_FORM_DEX,
    type TradingExchangeFormProps,
    useTradingAssets,
} from '@suite-common/trading';
import { DEFAULT_PAYMENT } from '@suite-common/wallet-constants';
import { type AccountKey } from '@suite-common/wallet-types';
import { asAmountUnit, unitsToSubunits } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { resolveAddressAndToken } from 'src/utils/wallet/trading/tradingUtils';

import { useTradingDefaultSellAsset } from '../common/useTradingDefaultSellAsset';

type UseTradingExchangeFormQuotesRequestValuesParams = {
    quotesRequest: ExchangeTradeQuoteRequest | undefined;
    selectedQuote: ExchangeTrade | undefined;
    accountKey: AccountKey | undefined;
    defaultValues: TradingExchangeFormProps;
};

export const useTradingExchangeFormQuotesRequestValues = ({
    quotesRequest,
    selectedQuote,
    accountKey,
    defaultValues,
}: UseTradingExchangeFormQuotesRequestValuesParams): TradingExchangeFormProps | null => {
    const { account, defaultAsset: sendCryptoSelect } = useTradingDefaultSellAsset({
        accountKey,
        cryptoId: quotesRequest?.send,
    });
    const { createAssetOptionFromCryptoId } = useTradingAssets();
    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(account?.symbol);

    if (!quotesRequest || !account || sendCryptoSelect?.id !== quotesRequest.send) {
        return null;
    }

    const { address, token } = resolveAddressAndToken(account, sendCryptoSelect.contractAddress);
    const { sendStringAmount } = quotesRequest;
    const amount =
        sendStringAmount && shouldSendInSats
            ? unitsToSubunits({
                  value: asAmountUnit(new BigNumber(sendStringAmount)),
                  symbol: account.symbol,
              }).toFixed()
            : sendStringAmount;
    const [defaultOutput] = defaultValues.outputs;

    return {
        ...defaultValues,
        sendCryptoSelect,
        receiveCryptoSelect: createAssetOptionFromCryptoId(quotesRequest.receive),
        provider: selectedQuote?.exchange,
        ...(selectedQuote && {
            [TRADING_EXCHANGE_FORM]: selectedQuote.isDex
                ? TRADING_EXCHANGE_FORM_DEX
                : TRADING_EXCHANGE_FORM_CEX,
        }),
        outputs: [{ ...DEFAULT_PAYMENT, ...defaultOutput, address, token, amount: amount ?? '' }],
    };
};
