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
} from '@suite-common/wallet-core';
import { type Account, toTokenAddress } from '@suite-common/wallet-types';
import { Column, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { submitUnwrapNativeTokenThunk } from 'src/actions/wallet/unwrapNativeTokenThunks';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { WrappedNativeFlowComplete } from '../common/WrappedNativeFlowComplete';
import { YieldActionStepWarning } from '../common/YieldActionStepWarning';
import { YieldFlowTransferRow } from '../common/YieldFlowTransferRow';
import { YieldUnwrapStep } from '../common/YieldUnwrapStep';
import { useWrappedNativeDeviceGuard } from '../common/useWrappedNativeDeviceGuard';
import { useWrappedNativePendingTx } from '../common/useWrappedNativePendingTx';

type UnwrapNativeTokenProps = {
    account: Account;
    tokenSymbol: string;
    tokenDecimals: number;
    tokenBalance: string;
    tokenContractAddress: string;
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
}: UnwrapNativeTokenProps) => {
    const dispatch = useDispatch();
    const ensureDeviceReady = useWrappedNativeDeviceGuard();
    const [broadcast, setBroadcast] = useState<BroadcastUnwrap | null>(null);
    const methods = useForm<YieldFlowFormValues>({
        mode: 'onChange',
        defaultValues: {
            amountInput: tokenBalance,
        },
    });

    const pendingTxStatus = useWrappedNativePendingTx(account, broadcast?.txid ?? null, 'unwrap');

    const amountInput = useWatch({ control: methods.control, name: 'amountInput' });
    const amount = new BigNumber(amountInput || '');
    const isAmountTooHigh = amount.gt(tokenBalance);
    const isAmountValid = amount.gt(0) && !isAmountTooHigh && methods.formState.isValid;

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
        methods.reset({ amountInput: tokenBalance });
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
        if (!(await ensureDeviceReady())) {
            return;
        }

        unwrapMutation.mutate(unwrapAmount);
    });

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
        if (broadcast && pendingTxStatus === 'confirmed') {
            return (
                <WrappedNativeFlowComplete
                    account={account}
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
                        isSubmitDisabled={!isAmountValid}
                        warning={
                            isAmountTooHigh ? (
                                <YieldActionStepWarning isInsufficientFunds />
                            ) : undefined
                        }
                        pendingTransaction={
                            broadcast
                                ? { type: 'unwrap', txid: broadcast.txid, amount: broadcast.amount }
                                : undefined
                        }
                        onMaxClick={() =>
                            methods.setValue('amountInput', tokenBalance, {
                                shouldValidate: true,
                            })
                        }
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
