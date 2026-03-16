import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type DexApprovalType } from 'invity-api';

import {
    selectTradingComposedTransactionInfo,
    selectTradingExchangeActiveQuote,
} from '@suite-common/trading';
import {
    type AccountsRootState,
    type FeesRootState,
    selectAccountByKey,
    selectConvertedNetworkFeeInfo,
} from '@suite-common/wallet-core';
import { useTranslate } from '@suite-native/intl';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

import { composeEvmApprovalFeeLevelsThunk } from '../../../thunks';

interface UseEvmApprovalFeesParams {
    approvalTypeOverride?: DexApprovalType;
}

export const useEvmApprovalFees = ({ approvalTypeOverride }: UseEvmApprovalFeesParams = {}) => {
    const dispatch = useDispatch();
    const { translate } = useTranslate();
    const [isComposing, setIsComposing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const quote = useSelector(selectTradingExchangeActiveQuote);
    const sendAccount = useSelector(selectExchangeSelectedSendAccount);
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, sendAccount?.key),
    );
    const feeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, sendAccount?.symbol),
    );
    const composedTransactionInfo = useSelector(selectTradingComposedTransactionInfo);

    const approvalType =
        approvalTypeOverride ?? ((quote?.approvalType ?? 'INFINITE') as DexApprovalType);
    const fee = composedTransactionInfo?.composed?.fee;
    const isLoading = isComposing || (fee === undefined && !error);

    const composeFees = useCallback(async () => {
        if (!quote?.dexTx?.data || !account || !feeInfo) {
            return;
        }

        setIsComposing(true);
        setError(null);
        try {
            await dispatch(
                composeEvmApprovalFeeLevelsThunk({
                    quote,
                    account,
                    feeInfo,
                    approvalTypeOverride,
                }),
            ).unwrap();
        } catch (composeError) {
            console.error('Failed to compose allowance fees:', composeError);
            setError(translate('moduleTrading.composeAllowanceError'));
        } finally {
            setIsComposing(false);
        }
    }, [dispatch, quote, account, feeInfo, approvalTypeOverride, translate]);

    // Keep a ref to the latest composeFees so the effect always calls the
    // current version without needing it as a dependency.
    const composeFeesRef = useRef(composeFees);
    composeFeesRef.current = composeFees;

    // Recompose only when the approval type or dex transaction data changes.
    useEffect(() => {
        composeFeesRef.current();
    }, [approvalType, quote?.dexTx?.data]);

    return {
        fee,
        error,
        isLoading,
        composeFees,
    };
};
