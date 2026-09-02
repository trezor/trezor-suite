import { useCallback, useEffect, useMemo, useRef } from 'react';
import { type UseFormReturn, useForm, useWatch } from 'react-hook-form';

import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type ResolvedYieldFlowData,
    type YieldFlowFormValues,
    type YieldFlowStepId,
    type YieldPositionFlowType,
    type YieldSessionState,
    getMaxWrapAmount,
    isYieldSessionResumable,
    isYieldWithdrawFlow,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { useCurrentRef, useFreshRef } from '@trezor/react-utils';

import { useYieldFiatInput } from './useYieldFiatInput';
import { type YieldAmountCardFiatToggleProps } from '../common/YieldAmountCard';
import {
    getYieldFiatRateToken,
    getYieldModifyAmountInput,
    getYieldUnwrapDefaultAmount,
    isAmountGreaterThan,
} from '../yieldFlowUtils';

export type AmountIssue = 'amount-empty' | 'amount-too-high' | 'amount-invalid-decimals';

type UseYieldFormProps = {
    flowType: YieldPositionFlowType;
    flowData: ResolvedYieldFlowData;
    account: Account;
    vault: YieldDtoV2;
    flowKey: string;
    session: YieldSessionState;
};

type UseYieldFormResult = {
    methods: UseFormReturn<YieldFlowFormValues>;
    liveAmount: string;
    maxAmount: string;
    setAmountInput: (amount: string) => void;
    amountIssues: AmountIssue[];
    fiatToggle: YieldAmountCardFiatToggleProps | undefined;
    setMaxAmount: (cryptoMax: string) => void;
    resetAmounts: (cryptoAmount: string) => void;
};

export const useYieldForm = ({
    flowType,
    flowData,
    account,
    vault,
    flowKey,
    session,
}: UseYieldFormProps): UseYieldFormResult => {
    const methods = useForm<YieldFlowFormValues>({
        mode: 'onChange',
        defaultValues: {
            amountInput: '',
            fiatInput: '',
        },
    });
    const methodsRef = useCurrentRef(methods);
    const unwrapDefaultAmountRef = useRef<string | null>(null);

    const { token, receiptToken } = flowData;
    const depositedAmount = flowData.depositedAmount ?? '0';
    const depositedSharesAmount = flowData.depositedSharesAmount ?? '0';

    // Fresh rather than commit-lagging: entry reset must read the current resumable session amount.
    const sessionRef = useFreshRef(session);
    const isSharesInput = flowType === 'redeem';

    const rateToken = getYieldFiatRateToken({
        step: session.step,
        flowType,
        accountSymbol: account.symbol,
        token,
    });
    const { fiatToggle, setMaxAmount, resetAmounts } = useYieldFiatInput({
        methods,
        symbol: rateToken?.symbol,
        tokenAddress: rateToken?.tokenAddress,
        decimals: token?.decimals ?? getNetwork(account.symbol).decimals,
        vaultId: vault.id,
    });
    const resetAmountsRef = useCurrentRef(resetAmounts);

    const getMaxAmount = (): string => {
        if (flowType === 'deposit') {
            if (session.step === 'wrap') {
                return getMaxWrapAmount(account.formattedBalance);
            }

            return token?.balance ?? '';
        }

        if (session.step === 'unwrap') {
            return token?.balance ?? '';
        }

        if (isSharesInput) {
            return depositedSharesAmount;
        }

        return depositedAmount;
    };
    const maxAmount = getMaxAmount();

    // Changing `flowType` triggers the reset because withdraw↔redeem changes the input unit.
    useEffect(() => {
        if (!flowKey) {
            return;
        }

        const resumedSession = isYieldSessionResumable(sessionRef.current)
            ? sessionRef.current
            : null;

        resetAmountsRef.current(
            resumedSession
                ? (resumedSession.action.pendingTransaction?.amount ??
                      resumedSession.action.amount ??
                      '')
                : '',
        );
    }, [flowKey, flowType, resetAmountsRef, sessionRef]);

    const prevStepRef = useRef<YieldFlowStepId | null>(null);

    // Redux thunks can transition steps outside this hook, so synchronize the form reactively.
    useEffect(() => {
        const prevStep = prevStepRef.current;
        const nextStep = session.step;

        if (prevStep !== null && prevStep !== nextStep) {
            if (prevStep === 'wrap' && nextStep === 'approve') {
                resetAmountsRef.current(session.action.amount ?? '');
            }

            if (nextStep === 'wrap') {
                resetAmountsRef.current('');
            }

            if (prevStep === 'approve' && nextStep === 'action') {
                const actionAmount = session.action.amount ?? '';
                const cappedAmount = isAmountGreaterThan({
                    amount: actionAmount,
                    threshold: maxAmount,
                })
                    ? maxAmount
                    : actionAmount;

                resetAmountsRef.current(cappedAmount);
            }

            if (prevStep === 'action' && nextStep === 'approve') {
                resetAmountsRef.current(
                    getYieldModifyAmountInput({
                        liveAmount: methodsRef.current.getValues('amountInput'),
                        actionAmount: session.action.amount,
                        maxAmount,
                    }),
                );
            }
        }

        prevStepRef.current = nextStep;
    }, [session.step, session.action.amount, methodsRef, resetAmountsRef, maxAmount]);

    // The unwrap step defaults to the amount just withdrawn, not the whole wrapped-native balance
    // — that would sweep in unrelated WETH (trezor/trezor-suite#30559).
    const pricePerShareState = vault.state?.pricePerShareState;
    const unwrapDefaultAmount = useMemo(() => {
        if (!token || !receiptToken || !isYieldWithdrawFlow(flowType)) {
            return token?.balance ?? '';
        }

        return getYieldUnwrapDefaultAmount({
            flowType,
            withdrawnAmount: session.result.completedAmount,
            token,
            receiptToken,
            pricePerShareState,
            fallbackAmount: token.balance,
        });
    }, [flowType, pricePerShareState, receiptToken, session.result.completedAmount, token]);

    useEffect(() => {
        if (session.step !== 'unwrap') {
            unwrapDefaultAmountRef.current = null;

            return;
        }

        const currentAmount = methodsRef.current.getValues('amountInput');

        if (
            unwrapDefaultAmountRef.current === null ||
            currentAmount === unwrapDefaultAmountRef.current
        ) {
            resetAmountsRef.current(unwrapDefaultAmount);
        }

        unwrapDefaultAmountRef.current = unwrapDefaultAmount;
    }, [methodsRef, resetAmountsRef, session.step, unwrapDefaultAmount]);

    const setAmountInput = useCallback(
        (amount: string) => {
            methodsRef.current.setValue('amountInput', amount);
        },
        [methodsRef],
    );

    const liveAmount = useWatch({ control: methods.control, name: 'amountInput' });
    // Max reserves gas, but manually entering the full native balance is allowed.
    const amountTooHighThreshold =
        flowType === 'deposit' && session.step === 'wrap' ? account.formattedBalance : maxAmount;
    // Errors on `amountInput` always block because it is submitted; hidden fiat errors block only
    // in fiat mode (trezor/trezor-suite#30900).
    const hasBlockingAmountError =
        !!methods.formState.errors.amountInput ||
        (fiatToggle?.currency === 'fiat' && !!methods.formState.errors.fiatInput);
    const amountIssues: AmountIssue[] = [];

    if (!liveAmount || !isAmountGreaterThan({ amount: liveAmount, threshold: '0' })) {
        amountIssues.push('amount-empty');
    }

    if (isAmountGreaterThan({ amount: liveAmount, threshold: amountTooHighThreshold })) {
        amountIssues.push('amount-too-high');
    }

    if (hasBlockingAmountError) {
        amountIssues.push('amount-invalid-decimals');
    }

    return {
        methods,
        liveAmount,
        maxAmount,
        setAmountInput,
        amountIssues,
        fiatToggle,
        setMaxAmount,
        resetAmounts,
    };
};
