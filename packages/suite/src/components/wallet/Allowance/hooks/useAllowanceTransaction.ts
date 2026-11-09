import { useCallback, useEffect, useMemo, useState } from 'react';

import { type ExtendedMessageDescriptor, type TranslationKey, isTranslationKey } from '@suite/intl';
import { REVOKE_ALLOWANCE_AMOUNT } from '@suite-common/wallet-core';
import {
    type Account,
    type AllowanceLimitType,
    type AllowanceTransactionType,
} from '@suite-common/wallet-types';
import { asAmountSubunit, findToken, getAllowanceAmountForLimit } from '@suite-common/wallet-utils';
import { useCurrentRef } from '@trezor/react-utils';
import { BigNumber } from '@trezor/utils';

import { useAllowanceCompose } from './useAllowanceCompose';
import { useAllowanceSend } from './useAllowanceSend';

export type UseAllowanceTransactionParams = {
    type: AllowanceTransactionType;
    /** Amount in token units the spender should be allowed to take. Ignored by a revoke. */
    amount: string;
    account: Account;
    tokenContractAddress: string;
    spender: string;
    onSelectLimitType?: (limitType: AllowanceLimitType) => void;
    onConfirm?: (limitType: AllowanceLimitType) => void;
    onSendStart?: () => void;
    onSent: (txid: string) => void;
    onSendFailed?: () => void;
    onCancel?: () => void;
    shouldShowApprovalToast?: boolean;
};

export type AllowanceComposeError = Pick<ExtendedMessageDescriptor, 'id' | 'values'>;

const DEFAULT_LIMIT_TYPE: AllowanceLimitType = 'minimal';

// A revoke always writes a zero allowance, so only an approval has an amount to convert.
const REVOKE_AMOUNTS: ReturnType<typeof getAllowanceAmountForLimit> = {
    inputAmount: asAmountSubunit(new BigNumber(0)),
    allowanceAmount: REVOKE_ALLOWANCE_AMOUNT,
};

export const useAllowanceTransaction = ({
    type,
    amount,
    account,
    tokenContractAddress,
    spender,
    onSelectLimitType,
    onConfirm,
    onSendStart,
    onSent,
    onSendFailed,
    onCancel,
    shouldShowApprovalToast,
}: UseAllowanceTransactionParams) => {
    const [limitType, setLimitType] = useState<AllowanceLimitType>(DEFAULT_LIMIT_TYPE);
    const [isSending, setIsSending] = useState(false);

    const token = findToken(account.tokens, tokenContractAddress);

    const isTokenResolved = type === 'revoke' || token !== undefined;

    const { inputAmount, allowanceAmount } =
        token && type === 'approve'
            ? getAllowanceAmountForLimit({ amount, limitType, token })
            : REVOKE_AMOUNTS;

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
        contract: tokenContractAddress,
        spender,
        token,
    });

    const { send } = useAllowanceSend({
        account,
        methods,
        shouldShowApprovalToast,
    });
    const selectedComposedLevel = composedLevels?.[selectedFee];
    const composedLevelsError = useMemo((): AllowanceComposeError | undefined => {
        if (selectedComposedLevel?.type !== 'error') {
            return undefined;
        }

        const { errorMessage } = selectedComposedLevel;

        if (!errorMessage || !isTranslationKey(errorMessage.id)) {
            return undefined;
        }

        return {
            id: errorMessage.id satisfies TranslationKey,
            values: errorMessage.values,
        };
    }, [selectedComposedLevel]);
    const canSubmit =
        isTokenResolved && !isComposing && !!composedTransaction && !composedLevelsError;

    const composeRequestRef = useCurrentRef(composeRequest);
    const callbacksRef = useCurrentRef({
        onSelectLimitType,
        onConfirm,
        onSendStart,
        onSent,
        onSendFailed,
        onCancel,
    });

    useEffect(() => {
        composeRequestRef.current();
    }, [allowanceAmount, composeRequestRef]);

    const selectLimitType = useCallback(
        (nextLimitType: AllowanceLimitType) => {
            setLimitType(nextLimitType);
            callbacksRef.current.onSelectLimitType?.(nextLimitType);
        },
        [callbacksRef],
    );

    const confirmAndSend = useCallback(async () => {
        if (!composedTransaction || !isTokenResolved) return;

        callbacksRef.current.onConfirm?.(limitType);
        callbacksRef.current.onSendStart?.();
        setIsSending(true);

        // Treat send rejection as a retryable failure.
        const result = await send({ composedTransaction }).catch(() => null);

        setIsSending(false);

        if (result?.txid) {
            callbacksRef.current.onSent(result.txid);

            return;
        }

        callbacksRef.current.onSendFailed?.();
    }, [composedTransaction, isTokenResolved, send, limitType, callbacksRef]);

    const handleCancel = useCallback(() => {
        callbacksRef.current.onCancel?.();
    }, [callbacksRef]);

    return {
        limitType,
        isComposing,
        isSending,
        allowanceAmount,
        inputAmount,
        token,
        feeInfo,
        composedLevels,
        composedTransaction,
        composedLevelsError,
        canSubmit,
        selectedFee,
        data,
        methods,
        selectLimitType,
        confirmAndSend,
        handleCancel,
        handleFeeChange: changeFeeLevel,
        composeRequest,
    };
};
