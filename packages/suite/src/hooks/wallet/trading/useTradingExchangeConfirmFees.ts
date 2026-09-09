import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import {
    exchangeThunks,
    selectTradingExchangeActiveTrade,
    selectTradingExchangeSelectedQuote,
} from '@suite-common/trading';
import {
    type FeesRootState,
    selectConvertedNetworkFeeInfo,
    useFetchFeesOnce,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';

export const useTradingExchangeConfirmFees = (account: Account | undefined) => {
    const { dispatch } = useServices(selectDispatch);

    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const trade = useSelector(selectTradingExchangeActiveTrade);
    const feeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, account?.symbol),
    );

    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(account?.symbol);
    const { getAssetDecimals } = useTradingAssetDecimals();

    const selectedTrade = trade?.data ?? selectedQuote;
    const decimals = getAssetDecimals({ accountKey: account?.key, cryptoId: selectedTrade?.send });

    useFetchFeesOnce({ networkSymbol: account?.symbol });

    const { sendAddress } = selectedTrade ?? {};
    const dexTransactionData = selectedQuote?.dexTx?.data;

    useEffect(() => {
        if (!account) {
            return;
        }

        dispatch(
            exchangeThunks.composeTradeFeeLevelsThunk({ account, decimals, shouldSendInSats }),
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        dispatch,
        account?.key,
        account?.descriptor,
        decimals,
        shouldSendInSats,
        feeInfo?.blockHeight,
        sendAddress,
        dexTransactionData,
    ]);
};
