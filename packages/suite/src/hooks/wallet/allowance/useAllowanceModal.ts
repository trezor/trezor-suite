import { useCallback, useEffect, useState } from 'react';

import { type CryptoId, type DexApprovalType } from 'invity-api';

import { parseCryptoId } from '@suite-common/trading';
import type { Account, AllowanceType, FeeLevelLabel } from '@suite-common/wallet-types';
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
    defaultFeeLevel?: FeeLevelLabel;
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
    defaultFeeLevel,
    onSelectApprovalType,
    onConfirm,
    onCancel,
}: UseAllowanceModalProps) => {
    const { state, tx } = useAllowanceContext();
    const closeModal = type === 'REVOKE' ? state.closeRevokeModal : state.closeApproveModal;
    const [approvalType, setApprovalType] = useState<DexApprovalType>(
        type === 'REVOKE' ? 'ZERO' : 'MINIMAL',
    );

    const { contractAddress: contract } = parseCryptoId(cryptoId);
    const token = contract ? findToken(account.tokens, contract) : undefined;

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
        contract: contract ?? '',
        spender,
        token,
        defaultFeeLevel,
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
        if (!contract || !token) {
            return;
        }

        composeRequestRef.current();
    }, [allowanceAmount, contract, token, composeRequestRef]);

    const selectApprovalType = useCallback(
        (selectedApprovalType: DexApprovalType) => {
            setApprovalType(selectedApprovalType);
            onSelectApprovalTypeRef.current?.(selectedApprovalType);
        },
        [onSelectApprovalTypeRef],
    );

    const confirmAndSend = useCallback(async () => {
        if (!composedTransaction) return;

        onConfirmRef.current?.();
        closeModal();
        state.setIsWaitingForDevice(true);

        try {
            const result = await send({ composedTransaction });

            if (result?.txid) {
                tx.setApprovalTxid(result.txid);
            }
        } finally {
            state.setIsWaitingForDevice(false);
        }
    }, [composedTransaction, send, state, tx, closeModal, onConfirmRef]);

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
