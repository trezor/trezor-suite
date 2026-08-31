import { useEffect, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { useMutation } from '@tanstack/react-query';

import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { WETH_WRAP_GAS_RESERVE } from '@suite-common/wallet-constants';
import {
    type YieldFlowDisplayToken,
    type YieldFlowFormValues,
    getMaxWrapAmount,
    shouldRecommendWrapReserve,
    useWrappedNativePendingTx,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Column, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { submitWrapNativeTokenThunk } from 'src/actions/wallet/wrapNativeTokenThunks';
import { useDispatch } from 'src/hooks/suite';
import { useMessageSystemWrappedNative } from 'src/hooks/suite/useMessageSystemWrappedNative';

import { WrappedNativeFlowComplete } from '../common/WrappedNativeFlowComplete';
import { YieldActionStepWarning } from '../common/YieldActionStepWarning';
import { YieldDisabledBanner } from '../common/YieldDisabledBanner';
import { YieldFlowTransferRow } from '../common/YieldFlowTransferRow';
import { YieldWrapStep } from '../common/YieldWrapStep';
import { useWrappedNativeDeviceGuard } from '../common/useWrappedNativeDeviceGuard';
import { useWrappedNativeFlowAnalytics } from '../common/useWrappedNativeFlowAnalytics';
import { useYieldFiatInput } from '../hooks/useYieldFiatInput';

type WrapNativeTokenProps = {
    account: Account;
    token: YieldFlowDisplayToken & { contractAddress: string };
    /** Reported upward because the page header lives outside this subtree, in the layout. */
    onFlowCompleteChange?: (isComplete: boolean) => void;
};

type BroadcastWrap = {
    txid: string;
    amount: string;
};

export const WrapNativeToken = ({ account, token, onFlowCompleteChange }: WrapNativeTokenProps) => {
    const dispatch = useDispatch();
    const ensureDeviceReady = useWrappedNativeDeviceGuard();
    const {
        isDisabled,
        content: disabledContent,
        variant: disabledVariant,
    } = useMessageSystemWrappedNative('wrap');
    const [broadcast, setBroadcast] = useState<BroadcastWrap | null>(null);
    const methods = useForm<YieldFlowFormValues>({
        mode: 'onChange',
        defaultValues: {
            amountInput: '',
            fiatInput: '',
        },
    });

    const pendingTxStatus = useWrappedNativePendingTx(account, broadcast?.txid ?? null, 'wrap');
    const isFlowComplete = !!broadcast && pendingTxStatus === 'confirmed';

    useEffect(() => {
        onFlowCompleteChange?.(isFlowComplete);
    }, [isFlowComplete, onFlowCompleteChange]);

    const { reportSubmit, reportMaxClick } = useWrappedNativeFlowAnalytics({
        flowType: 'wrap',
        status: pendingTxStatus,
        txid: broadcast?.txid ?? null,
        networkSymbol: account.symbol,
    });

    const nativeSymbol = getNetworkDisplaySymbol(account.symbol);
    const nativeToken: YieldFlowDisplayToken = {
        networkSymbol: account.symbol,
        symbol: nativeSymbol,
        decimals: token.decimals,
    };

    // Max leaves the gas reserve aside while the balance covers it, otherwise it fills the whole
    // balance. The field shows the full balance and the user may wrap up to it; eating into the
    // reserve only triggers a non-blocking recommendation.
    const maxWrapAmount = getMaxWrapAmount(account.formattedBalance);

    const { fiatToggle, setMaxAmount } = useYieldFiatInput({
        methods,
        symbol: account.symbol,
        decimals: token.decimals,
    });

    const amountInput = useWatch({ control: methods.control, name: 'amountInput' });
    const amount = new BigNumber(amountInput || '');
    const isAmountTooHigh = amount.gt(account.formattedBalance);
    const isReserveRecommended = shouldRecommendWrapReserve(amountInput, account.formattedBalance);
    const isAmountValid = amount.gt(0) && !isAmountTooHigh && methods.formState.isValid;

    const shouldCheckWrapAmount = !!broadcast;

    useEffect(() => {
        if (pendingTxStatus !== 'failed') {
            return;
        }

        dispatch(
            notificationsActions.addToast({
                type: 'sign-tx-error',
                error: 'Wrap transaction failed.',
            }),
        );
        setBroadcast(null);
        methods.reset({ amountInput: '', fiatInput: '' });
    }, [pendingTxStatus, dispatch, methods]);

    const wrapMutation = useMutation({
        mutationFn: (wrapAmount: string) =>
            dispatch(submitWrapNativeTokenThunk({ account, token, wrapAmount })).unwrap(),
        onSuccess: (result, wrapAmount) => {
            if (result) {
                setBroadcast({ txid: result.txid, amount: wrapAmount });
            }
        },
    });

    const handleSubmit = methods.handleSubmit(async ({ amountInput: wrapAmount }) => {
        // The form stays mounted while a wrap is pending so its transaction remains visible, which
        // leaves this path reachable after the feature has been disabled remotely. Checked before
        // reporting so a blocked submit is not counted as one.
        if (isDisabled) {
            return;
        }

        reportSubmit();

        if (!(await ensureDeviceReady())) {
            return;
        }

        wrapMutation.mutate(wrapAmount);
    });

    const handleMaxClick = () => {
        reportMaxClick();

        setMaxAmount(maxWrapAmount);
    };

    const openTxDetail = (txid: string) => {
        dispatch(
            openModal({
                type: 'transaction-detail',
                txid,
                descriptor: account.descriptor,
                symbol: account.symbol,
                deviceState: account.deviceState,
                flow: 'detail',
            }),
        );
    };

    const renderWrapWarning = () => {
        if (!shouldCheckWrapAmount) {
            return null;
        }

        if (isAmountTooHigh) {
            return <YieldActionStepWarning isInsufficientFunds />;
        }

        if (isReserveRecommended) {
            return (
                <YieldActionStepWarning
                    reserveRecommendation={{
                        amount: WETH_WRAP_GAS_RESERVE.toString(),
                        nativeSymbol,
                    }}
                />
            );
        }

        return null;
    };

    const renderContent = () => {
        if (broadcast && isFlowComplete) {
            return (
                <WrappedNativeFlowComplete
                    account={account}
                    flow="wrap"
                    heading={<Translation id="TR_WRAP_COMPLETE_HEADING" />}
                    description={
                        <Translation
                            id="TR_WRAP_COMPLETE_DESCRIPTION"
                            values={{ nativeSymbol, tokenSymbol: token.symbol }}
                        />
                    }
                >
                    <YieldFlowTransferRow
                        inputLabelId="TR_EARN_YIELD_WRAP_AMOUNT"
                        outputLabelId="TR_RECEIVED"
                        input={{ token: nativeToken, amount: broadcast.amount }}
                        output={{ token, amount: broadcast.amount }}
                    />
                </WrappedNativeFlowComplete>
            );
        }

        // A wrap already broadcast keeps rendering the form, so its pending transaction stays visible.
        if (isDisabled && !broadcast) {
            return (
                <YieldDisabledBanner
                    type="wrap"
                    content={disabledContent}
                    variant={disabledVariant}
                />
            );
        }

        return (
            <>
                <Text typographyStyle="headline-md">
                    <Translation
                        id="TR_EARN_YIELD_WRAP_TITLE"
                        values={{ nativeSymbol, tokenSymbol: token.symbol }}
                    />
                </Text>

                <FormProvider {...methods}>
                    <YieldWrapStep
                        token={token}
                        nativeSymbol={nativeSymbol}
                        availableAmount={account.formattedBalance}
                        shouldShowReceivingRow={false}
                        isSubmitting={wrapMutation.isPending}
                        isSubmitDisabled={!isAmountValid || isDisabled}
                        warning={renderWrapWarning()}
                        pendingTransaction={
                            broadcast
                                ? { type: 'wrap', txid: broadcast.txid, amount: broadcast.amount }
                                : undefined
                        }
                        fiatToggle={fiatToggle}
                        onMaxClick={handleMaxClick}
                        onSubmit={handleSubmit}
                        onPendingTxClick={openTxDetail}
                    />
                </FormProvider>
            </>
        );
    };

    return (
        <Column width="100%" alignItems="center">
            <Column gap={24} width="100%" maxWidth={500}>
                {renderContent()}
            </Column>
        </Column>
    );
};
