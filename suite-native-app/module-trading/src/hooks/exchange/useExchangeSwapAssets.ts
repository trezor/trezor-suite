import { useSelector } from 'react-redux';

import type { CryptoId, ExchangeTrade } from 'invity-api';

import { type TradingAssetOption, useTradingAssets } from '@suite-common/trading';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { type CombinedLabelingState } from '@suite-native/labeling';
import { type TradingHistoryDetailCryptoAsset } from '@suite-native/trading-history';
import {
    selectAccountLabelWithNetworkFallback,
    selectExchangeSelectedReceiveAccount,
    selectExchangeSelectedSendAccount,
} from '@suite-native/trading-state';

import { useExchangeReceiveAmount } from './useExchangeReceiveAmount';

type ExchangeSwapAssets = {
    payAsset: TradingHistoryDetailCryptoAsset | undefined;
    getAsset: TradingHistoryDetailCryptoAsset | undefined;
};

type GetSwapCryptoAssetParams = {
    accountLabel?: string;
    amount: string;
    createAssetOptionFromCryptoId: (cryptoId?: CryptoId) => TradingAssetOption;
    cryptoId: CryptoId;
};

const getSwapCryptoAsset = ({
    accountLabel,
    amount,
    createAssetOptionFromCryptoId,
    cryptoId,
}: GetSwapCryptoAssetParams): TradingHistoryDetailCryptoAsset => {
    const cryptoAsset = createAssetOptionFromCryptoId(cryptoId);

    return {
        type: 'crypto',
        accountLabel: accountLabel ?? cryptoAsset.networkName,
        amount,
        contractAddress: cryptoAsset.isNativeToken ? undefined : cryptoAsset.contractAddress,
        cryptoId,
        networkSymbol: cryptoAsset.networkSymbol,
    };
};

export const useExchangeSwapAssets = (quote: ExchangeTrade | undefined): ExchangeSwapAssets => {
    const { createAssetOptionFromCryptoId } = useTradingAssets();
    const { receiveAmount } = useExchangeReceiveAmount(quote);
    const sendAccount = useSelector(selectExchangeSelectedSendAccount);
    const receiveAccount = useSelector(selectExchangeSelectedReceiveAccount);

    const payAccountLabel = useSelector((state: AccountsRootState & CombinedLabelingState) =>
        selectAccountLabelWithNetworkFallback(state, sendAccount?.key, quote?.send),
    );
    const getAccountLabel = useSelector((state: AccountsRootState & CombinedLabelingState) =>
        selectAccountLabelWithNetworkFallback(state, receiveAccount?.account.key, quote?.receive),
    );

    const payAsset =
        quote?.send && quote.sendStringAmount
            ? getSwapCryptoAsset({
                  accountLabel: payAccountLabel,
                  amount: quote.sendStringAmount,
                  createAssetOptionFromCryptoId,
                  cryptoId: quote.send,
              })
            : undefined;
    const getAsset =
        quote?.receive && receiveAmount
            ? getSwapCryptoAsset({
                  accountLabel: getAccountLabel,
                  amount: receiveAmount,
                  createAssetOptionFromCryptoId,
                  cryptoId: quote.receive,
              })
            : undefined;

    return { payAsset, getAsset };
};
