import { useEffect, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { useMutation } from '@tanstack/react-query';

import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type YieldFlowDisplayToken,
    type YieldFlowFormValues,
    selectBaseCurrency,
    useMissingRateTickersQuery,
    useWrappedNativePendingTx,
} from '@suite-common/wallet-core';
import { type Account, toTokenAddress } from '@suite-common/wallet-types';
import { Column, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { submitUnwrapNativeTokenThunk } from 'src/actions/wallet/unwrapNativeTokenThunks';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useMessageSystemWrappedNative } from 'src/hooks/suite/useMessageSystemWrappedNative';

import { WrappedNativeFlowComplete } from '../common/WrappedNativeFlowComplete';
import { YieldActionStepWarning } from '../common/YieldActionStepWarning';
import { YieldDisabledBanner } from '../common/YieldDisabledBanner';
import { YieldFlowTransferRow } from '../common/YieldFlowTransferRow';
import { YieldUnwrapStep } from '../common/YieldUnwrapStep';
import { useWrappedNativeDeviceGuard } from '../common/useWrappedNativeDeviceGuard';
import { useWrappedNativeFlowAnalytics } from '../common/useWrappedNativeFlowAnalytics';
import { useYieldFiatInput } from '../hooks/useYieldFiatInput';

type UnwrapNativeTokenProps = {
    account: Account;
    tokenSymbol: string;
    tokenDecimals: number;
    tokenBalance: string;
    tokenContractAddress: string;
    /** Reported upward because the page header lives outside this subtree, in the layout. */
    onFlowCompleteChange?: (isComplete: boolean) => void;
};

type BroadcastUnwrap = {
    txid: string;
    amount: string;
};

export const UnwrapNativeToken = ({
    account,
    tokenSymbol,
    tokenDecimals,
    tokenBalance,
    tokenContractAddress,
    onFlowCompleteChange,
}: UnwrapNativeTokenProps) => {
    const dispatch = useDispatch();
    const ensureDeviceReady = useWrappedNativeDeviceGuard();
    const {
        isDisabled,
        content: disabledContent,
        variant: disabledVariant,
    } = useMessageSystemWrappedNative('unwrap');
    const [broadcast, setBroadcast] = useState<BroadcastUnwrap | null>(null);
    const methods = useForm<YieldFlowFormValues>({
        mode: 'onChange',
        defaultValues: {
            amountInput: tokenBalance,
            fiatInput: '',
        },
    });

    const { fiatToggle, setMaxAmount } = useYieldFiatInput({
        methods,
        symbol: account.symbol,
        decimals: tokenDecimals,
    });

    const pendingTxStatus = useWrappedNativePendingTx(account, broadcast?.txid ?? null, 'unwrap');
    const isFlowComplete = !!broadcast && pendingTxStatus === 'confirmed';

    useEffect(() => {
        onFlowCompleteChange?.(isFlowComplete);
    }, [isFlowComplete, onFlowCompleteChange]);

    const { reportSubmit, reportMaxClick } = useWrappedNativeFlowAnalytics({
        flowType: 'unwrap',
        status: pendingTxStatus,
        txid: broadcast?.txid ?? null,
        networkSymbol: account.symbol,
    });

    const amountInput = useWatch({ control: methods.control, name: 'amountInput' });
    const amount = new BigNumber(amountInput || '');
    const isAmountTooHigh = amount.gt(tokenBalance);
    const isAmountValid = amount.gt(0) && !isAmountTooHigh && methods.formState.isValid;

    const shouldCheckUnwrapAmount = !!broadcast;

    const nativeSymbol = getNetworkDisplaySymbol(account.symbol);

    const baseCurrency = useSelector(selectBaseCurrency);
    // The wrapped-native token (WETH) is not held as a balance, so its fiat rate is not fetched by
    // the balance-driven path. Force-fetch it so the approximate fiat value can render.
    useMissingRateTickersQuery({
        baseCurrencyCode: baseCurrency,
        missingRateTickers: [
            { symbol: account.symbol, tokenAddress: toTokenAddress(tokenContractAddress) },
        ],
    });
    const wrappedToken: YieldFlowDisplayToken & { contractAddress: string } = {
        networkSymbol: account.symbol,
        symbol: tokenSymbol,
        decimals: tokenDecimals,
        contractAddress: tokenContractAddress,
    };
    const nativeToken: YieldFlowDisplayToken = {
        networkSymbol: account.symbol,
        symbol: nativeSymbol,
        decimals: tokenDecimals,
    };

    useEffect(() => {
        if (pendingTxStatus !== 'failed') {
            return;
        }

        dispatch(
            notificationsActions.addToast({
                type: 'sign-tx-error',
                error: 'Unwrap transaction failed.',
            }),
        );
        setBroadcast(null);
        methods.reset({ amountInput: tokenBalance, fiatInput: '' });
    }, [pendingTxStatus, dispatch, methods, tokenBalance]);

    const unwrapMutation = useMutation({
        mutationFn: (unwrapAmount: string) =>
            dispatch(
                submitUnwrapNativeTokenThunk({ account, token: wrappedToken, unwrapAmount }),
            ).unwrap(),
        onSuccess: (result, unwrapAmount) => {
            if (result) {
                setBroadcast({ txid: result.txid, amount: unwrapAmount });
            }
        },
    });

    const handleSubmit = methods.handleSubmit(async ({ amountInput: unwrapAmount }) => {
        // The form stays mounted while an unwrap is pending so its transaction remains visible,
        // which leaves this path reachable after the feature has been disabled remotely. Checked
        // before reporting so a blocked submit is not counted as one.
        if (isDisabled) {
            return;
        }

        reportSubmit();

        if (!(await ensureDeviceReady())) {
            return;
        }

        unwrapMutation.mutate(unwrapAmount);
    });

    const handleMaxClick = () => {
        reportMaxClick();

        setMaxAmount(tokenBalance);
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

    const renderContent = () => {
        if (broadcast && isFlowComplete) {
            return (
                <WrappedNativeFlowComplete
                    account={account}
                    flow="unwrap"
                    heading={<Translation id="TR_UNWRAP_COMPLETE_HEADING" />}
                    description={
                        <Translation
                            id="TR_UNWRAP_COMPLETE_DESCRIPTION"
                            values={{ tokenSymbol, nativeSymbol }}
                        />
                    }
                >
                    <YieldFlowTransferRow
                        inputLabelId="TR_EARN_YIELD_UNWRAP_AMOUNT"
                        outputLabelId="TR_RECEIVED"
                        input={{ token: wrappedToken, amount: broadcast.amount }}
                        output={{ token: nativeToken, amount: broadcast.amount }}
                    />
                </WrappedNativeFlowComplete>
            );
        }

        // An unwrap already broadcast keeps rendering the form, so its pending transaction stays visible.
        if (isDisabled && !broadcast) {
            return (
                <YieldDisabledBanner
                    type="unwrap"
                    content={disabledContent}
                    variant={disabledVariant}
                />
            );
        }

        return (
            <>
                <Text typographyStyle="headline-md">
                    <Translation
                        id="TR_EARN_YIELD_UNWRAP_TITLE"
                        values={{ tokenSymbol, nativeSymbol }}
                    />
                </Text>

                <FormProvider {...methods}>
                    <YieldUnwrapStep
                        tokenSymbol={tokenSymbol}
                        tokenDecimals={tokenDecimals}
                        tokenBalance={tokenBalance}
                        approxFiat={{ symbol: account.symbol, tokenContractAddress }}
                        isSubmitting={unwrapMutation.isPending}
                        isSubmitDisabled={!isAmountValid || isDisabled}
                        warning={
                            shouldCheckUnwrapAmount && isAmountTooHigh ? (
                                <YieldActionStepWarning isInsufficientFunds />
                            ) : undefined
                        }
                        pendingTransaction={
                            broadcast
                                ? { type: 'unwrap', txid: broadcast.txid, amount: broadcast.amount }
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
