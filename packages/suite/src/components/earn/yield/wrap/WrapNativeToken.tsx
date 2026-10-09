import { useEffect, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { useMutation } from '@tanstack/react-query';

import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { useFormatters } from '@suite-common/formatters';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type YieldFlowDisplayToken,
    type YieldFlowFormValues,
    getWrapReserveStatus,
    getWrappableNativeBalance,
    getYieldNativeFeeStatus,
    useEvmPendingTxStatus,
    useFetchFees,
    useYieldGasReserve,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Column, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import { submitWrapNativeTokenThunk } from 'src/actions/wallet/wrapNativeTokenThunks';
import { useIsFeeRefetchDisabled } from 'src/components/wallet/Fees/CollapsibleFees/hooks/useIsFeeRefetchDisabled';
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
    const { dispatch } = useServices(injectDispatch);
    const { CryptoAmountFormatter } = useFormatters();
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

    const { status: pendingTxStatus } = useEvmPendingTxStatus(
        account,
        broadcast?.txid ?? null,
        'wrap',
    );
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

    const isRefetchDisabled = useIsFeeRefetchDisabled();
    useFetchFees({ networkSymbol: account.symbol, isRefetchDisabled });

    // The same reserve a wrapped-native vault deposit keeps aside: a wrap is the first step of
    // that deposit, so the native coin left behind has to cover the same follow-up fees.
    const gasReserve = useYieldGasReserve({
        networkSymbol: account.symbol,
        isWrappedNativeVault: true,
        tokenContractAddress: token.contractAddress,
    });

    const formattedReserve = CryptoAmountFormatter.format(gasReserve.recommended, {
        symbol: account.symbol,
        isBalance: true,
        withSymbol: false,
    });

    // The summary shows the full balance; Max keeps the recommended reserve aside. The user may
    // still wrap up to the full balance, which only triggers a non-blocking recommendation; a
    // balance that does not exceed the reserve blocks the wrap outright.
    const maxWrapAmount = getWrappableNativeBalance(
        account.formattedBalance,
        gasReserve.recommended,
    );

    const isNativeFeeInsufficient =
        getYieldNativeFeeStatus({
            nativeBalance: account.formattedBalance,
            reserve: gasReserve,
            isWrapStep: true,
            isWrappedNativeVault: true,
        }) === 'insufficient';

    const { fiatToggle, setMaxAmount } = useYieldFiatInput({
        methods,
        symbol: account.symbol,
        decimals: token.decimals,
    });

    const amountInput = useWatch({ control: methods.control, name: 'amountInput' });
    const amount = new BigNumber(amountInput || '');
    const isAmountTooHigh = amount.gt(account.formattedBalance);

    const wrapReserveStatus = getWrapReserveStatus({
        amountInput,
        nativeFormattedBalance: account.formattedBalance,
        reserve: gasReserve.recommended,
    });
    const isAmountValid = amount.gt(0) && !isAmountTooHigh && methods.formState.isValid;

    const shouldCheckWrapAmount = !broadcast;

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
                showCancelButton: true,
            }),
        );
    };

    const renderWrapWarning = () => {
        if (!shouldCheckWrapAmount) {
            return null;
        }

        if (isNativeFeeInsufficient) {
            return (
                <YieldActionStepWarning
                    insufficientFeeReserve={{ amount: formattedReserve, nativeSymbol }}
                />
            );
        }

        if (isAmountTooHigh) {
            return <YieldActionStepWarning isInsufficientFunds />;
        }

        if (wrapReserveStatus === 'kept') {
            return (
                <YieldActionStepWarning reserveKept={{ amount: formattedReserve, nativeSymbol }} />
            );
        }

        if (wrapReserveStatus === 'below') {
            return (
                <YieldActionStepWarning
                    reserveRecommendation={{ amount: formattedReserve, nativeSymbol }}
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
                        isSubmitDisabled={!isAmountValid || isDisabled || isNativeFeeInsufficient}
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
