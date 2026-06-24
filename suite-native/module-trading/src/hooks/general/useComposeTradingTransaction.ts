import { useCallback } from 'react';
import { useDispatch, useStore } from 'react-redux';

import { selectTradingAccountKeyByTradeType } from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type FeesRootState,
    type FormDraftRootState,
    selectAccountByKey,
    selectConvertedNetworkFeeInfo,
    selectDeepCopyOfFormDraft,
} from '@suite-common/wallet-core';
import { type FeeLevelLabel } from '@suite-common/wallet-types';
import { type TradingRootState, getFormDraftKeyByTradeType } from '@suite-native/trading-state';

import { composeTradingTransactionThunk } from '../../thunks';

type TradingTransactionRootState = TradingRootState &
    AccountsRootState &
    FeesRootState &
    FormDraftRootState;

type UseComposeTradingTransactionProps = {
    tradeType: 'exchange' | 'sell';
};

export const useComposeTradingTransaction = ({ tradeType }: UseComposeTradingTransactionProps) => {
    const dispatch = useDispatch();
    const store = useStore<TradingTransactionRootState>();

    const composeTradingTransaction = useCallback(async () => {
        const state = store.getState();
        const sendAccountKey = selectTradingAccountKeyByTradeType(state, tradeType);
        const sendAccount = selectAccountByKey(state, sendAccountKey);
        const draft = selectDeepCopyOfFormDraft(state, getFormDraftKeyByTradeType(tradeType));
        const networkFeeInfo = selectConvertedNetworkFeeInfo(state, sendAccount?.symbol);

        if (!sendAccount || !networkFeeInfo) {
            console.error('Send account and networkFeeInfo are required for composing transaction');

            return;
        }

        try {
            await dispatch(
                composeTradingTransactionThunk({
                    tradeType,
                    account: sendAccount,
                    network: getNetwork(sendAccount.symbol),
                    feeInfo: networkFeeInfo,
                    selectedFeeLevel: draft?.selectedFee as FeeLevelLabel,
                    feePerUnit: draft?.feePerUnit,
                    feeLimit: draft?.feeLimit,
                    maxPriorityFeePerGas: draft?.maxPriorityFeePerGas,
                    maxFeePerGas: draft?.maxFeePerGas,
                }),
            ).unwrap();
        } catch (error) {
            console.error('Failed to compose trading transaction:', error);
        }
    }, [dispatch, store, tradeType]);

    return { composeTradingTransaction };
};
