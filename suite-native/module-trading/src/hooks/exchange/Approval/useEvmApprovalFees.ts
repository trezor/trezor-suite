import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type DexApprovalType } from 'invity-api';

import {
    selectTradingComposedTransactionInfo,
    selectTradingExchangeActiveQuote,
} from '@suite-common/trading';
import {
    type AccountsRootState,
    type FeesRootState,
    type FormDraftRootState,
    selectAccountByKey,
    selectConvertedNetworkFeeInfo,
    selectDeepCopyOfFormDraft,
} from '@suite-common/wallet-core';
import { type FeeLevelLabel } from '@suite-common/wallet-types';
import { useTranslate } from '@suite-native/intl';
import {
    getFormDraftKeyByTradeType,
    selectExchangeSelectedSendAccount,
} from '@suite-native/trading-state';

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

    const formDraftKey = getFormDraftKeyByTradeType('exchange');
    const formDraft = useSelector((state: FormDraftRootState) =>
        selectDeepCopyOfFormDraft(state, formDraftKey),
    );
    const selectedFeeLevel = (formDraft?.selectedFee as FeeLevelLabel) ?? 'normal';

    const feeLimit = formDraft?.feeLimit as string | undefined;
    const feePerUnit = formDraft?.feePerUnit as string | undefined;
    const maxFeePerGas = formDraft?.maxFeePerGas as string | undefined;
    const maxPriorityFeePerGas = formDraft?.maxPriorityFeePerGas as string | undefined;

    const customFee = useMemo(() => {
        if (selectedFeeLevel !== 'custom' || !feeLimit || !feePerUnit) {
            return undefined;
        }

        return {
            feeLimit,
            feePerUnit,
            maxFeePerGas,
            maxPriorityFeePerGas,
        };
    }, [selectedFeeLevel, feeLimit, feePerUnit, maxFeePerGas, maxPriorityFeePerGas]);

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
                    selectedFeeLevel,
                    customFee,
                    approvalTypeOverride,
                }),
            ).unwrap();
        } catch (composeError) {
            console.error('Failed to compose allowance fees:', composeError);
            setError(translate('moduleTrading.composeAllowanceError'));
        } finally {
            setIsComposing(false);
        }
    }, [
        dispatch,
        quote,
        account,
        feeInfo,
        selectedFeeLevel,
        customFee,
        approvalTypeOverride,
        translate,
    ]);

    // Keep a ref to the latest composeFees so the effect always calls the
    // current version without needing it as a dependency.
    const composeFeesRef = useRef(composeFees);
    composeFeesRef.current = composeFees;

    // Recompose when the approval type, dex transaction data, fee level, or custom gas fields change.
    useEffect(() => {
        composeFeesRef.current();
    }, [approvalType, quote?.dexTx?.data, selectedFeeLevel, customFee]);

    return {
        fee,
        error,
        isLoading,
        composeFees,
    };
};
