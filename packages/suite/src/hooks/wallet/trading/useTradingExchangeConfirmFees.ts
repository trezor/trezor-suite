import { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { selectDispatch } from '@suite-common/redux-utils';
import {
    type TradingComposedTransactionInfo,
    buildExchangeComposeInputs,
    buildTradingComposeFormState,
    exchangeThunks,
    getTradingFormState,
    hasEip712SignDataType,
    selectTradingComposedTransactionInfo,
    selectTradingExchangeActiveTrade,
    selectTradingExchangeProviders,
    selectTradingExchangeReceiveAccountKey,
    selectTradingExchangeSelectedQuote,
    tradingActions,
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
    const device = useSelector((state: DeviceRootState) => selectSelectedDevice(state));
    const providers = useSelector(selectTradingExchangeProviders);
    const receiveAccountKey = useSelector(selectTradingExchangeReceiveAccountKey);
    const { composed, selectedFee } = useSelector(selectTradingComposedTransactionInfo);

    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(account?.symbol);
    const { getAssetDecimals } = useTradingAssetDecimals();

    const selectedTrade = trade?.data ?? selectedQuote;
    const decimals = getAssetDecimals({ accountKey: account?.key, cryptoId: selectedTrade?.send });

    useFetchFeesOnce({ networkSymbol: account?.symbol });

    const { sendAddress } = selectedTrade ?? {};
    const dexTransactionData = selectedQuote?.dexTx?.data;

    const composeRequestRef = useRef<{ abort: () => void } | null>(null);

    const compose = (composeAccount: Account) => {
        composeRequestRef.current?.abort();
        composeRequestRef.current = dispatch(
            exchangeThunks.composeTradeFeeLevelsThunk({
                account: composeAccount,
                decimals,
                shouldSendInSats,
            }),
        );
    };

    useEffect(() => {
        if (!account) {
            return;
        }

        compose(account);

        return () => composeRequestRef.current?.abort();
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

    const composeFormState = useMemo(() => {
        if (!account || !composed || !selectedTrade || hasEip712SignDataType(selectedTrade)) {
            return undefined;
        }

        const composeInputs = buildExchangeComposeInputs({
            selectedQuote,
            selectedTrade,
            networkType: account.networkType,
            decimals,
            shouldSendInSats,
        });

        if (!composeInputs) {
            return undefined;
        }

        return buildTradingComposeFormState({
            account,
            device,
            ...composeInputs.recomposeInputs,
            setMaxOutputId: undefined,
            composed,
            selectedFee,
            tradingFormState: getTradingFormState({
                activeSection: 'exchange',
                providers,
                trade: composeInputs.trade,
                isSlip24Active: false,
                sendAccountKey: account.key,
                receiveAccountKey,
            }),
        });
    }, [
        account,
        composed,
        decimals,
        device,
        providers,
        receiveAccountKey,
        selectedFee,
        selectedQuote,
        selectedTrade,
        shouldSendInSats,
    ]);

    const applySelectedFee = (composedTransactionInfo: TradingComposedTransactionInfo) => {
        if (!account) {
            return;
        }

        dispatch(tradingActions.saveComposedTransactionInfo(composedTransactionInfo));
        compose(account);
    };

    return { feeInfo, composeFormState, applySelectedFee };
};
