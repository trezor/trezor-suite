import { useCallback, useEffect, useState } from 'react';

import { type CryptoId, type DexApprovalType } from 'invity-api';

import { parseCryptoId } from '@suite-common/trading';
import { type Account, type AllowanceType } from '@suite-common/wallet-types';
import { asAmountSubunit, findToken, getAllowanceAmount } from '@suite-common/wallet-utils';
import { useCurrentRef } from '@trezor/react-utils';
import { BigNumber } from '@trezor/utils';

import { useAllowanceCompose } from './useAllowanceCompose';
import { useAllowanceContext } from './useAllowanceContext';
import { useAllowanceSend } from './useAllowanceSend';

interface UseAllowanceModalProps {
    type: AllowanceType;
    amount: string;
    cryptoId: CryptoId;
    account: Account;
    spender: string;
    onSelectApprovalType?: (type: DexApprovalType) => void;
    onConfirm?: () => void;
    onCancel?: () => void;
}

export const useAllowanceModal = ({
    type,
    amount: rawAmount,
    cryptoId,
    account,
    spender,
    onSelectApprovalType,
    onConfirm,
    onCancel,
}: UseAllowanceModalProps) => {
    const { state, tx } = useAllowanceContext();
    const closeModal = type === 'APPROVE' ? state.closeApproveModal : state.closeRevokeModal;
    const openModal = type === 'APPROVE' ? state.openApproveModal : state.openRevokeModal;
    const [approvalType, setApprovalType] = useState<DexApprovalType>(
        type === 'REVOKE' ? 'ZERO' : 'MINIMAL',
    );

    const { contractAddress: contract = '' } = parseCryptoId(cryptoId);
    const token = findToken(account.tokens, contract);

    const { inputAmount = asAmountSubunit(new BigNumber(0)), allowanceAmount = '0' } = token
        ? getAllowanceAmount({ rawAmount, approvalType, token })
        : {};

    const {
        data,
        feeInfo,
        isComposing,
        composedLevels,
        composedTransaction,
        selectedFee,
        composeRequest,
        methods,
        changeFeeLevel,
    } = useAllowanceCompose({
        account,
        amount: allowanceAmount,
        contract,
        spender,
        token,
    });

    const { send } = useAllowanceSend({
        account,
        methods,
    });

    const composeRequestRef = useCurrentRef(composeRequest);
    const onSelectApprovalTypeRef = useCurrentRef(onSelectApprovalType);
    const onConfirmRef = useCurrentRef(onConfirm);
    const onCancelRef = useCurrentRef(onCancel);

    useEffect(() => {
        composeRequestRef.current();
    }, [allowanceAmount, composeRequestRef]);

    const selectApprovalType = useCallback(
        (type: DexApprovalType) => {
            setApprovalType(type);
            onSelectApprovalTypeRef.current?.(type);
        },
        [onSelectApprovalTypeRef],
    );

    const confirmAndSend = useCallback(async () => {
        if (!composedTransaction) return;

        onConfirmRef.current?.();
        closeModal();
        state.setIsWaitingForDevice(true);

        let txid: string | null = null;

        try {
            const result = await send({ composedTransaction });

            if (result?.txid) {
                txid = result.txid;
                tx.setApprovalTxid(result.txid);
            }
        } catch {
            // Device flow failed or was rejected — re-open the modal so user can retry or cancel
        } finally {
            state.setIsWaitingForDevice(false);

            if (!txid) {
                openModal();
            }
        }
    }, [composedTransaction, send, state, tx, closeModal, openModal, onConfirmRef]);

    const handleClose = useCallback(() => {
        closeModal();
        onCancelRef.current?.();
    }, [closeModal, onCancelRef]);

    return {
        approvalType,
        isLoading: isComposing,
        allowanceAmount,
        inputAmount,
        token,
        feeInfo,
        composedLevels,
        composedTransaction,
        selectedFee,
        data,
        methods,
        selectApprovalType,
        confirmAndSend,
        handleClose,
        handleFeeChange: changeFeeLevel,
    };
};
