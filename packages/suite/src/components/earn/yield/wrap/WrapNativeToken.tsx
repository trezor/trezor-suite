import { useEffect, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { useMutation } from '@tanstack/react-query';

import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { WETH_WRAP_GAS_RESERVE } from '@suite-common/wallet-constants';
import { type YieldFlowDisplayToken, type YieldFlowFormValues } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Column, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { submitWrapNativeTokenThunk } from 'src/actions/wallet/wrapNativeTokenThunks';
import { useDispatch } from 'src/hooks/suite';

import { WrappedNativeFlowComplete } from '../common/WrappedNativeFlowComplete';
import { YieldActionStepWarning } from '../common/YieldActionStepWarning';
import { YieldFlowTransferRow } from '../common/YieldFlowTransferRow';
import { YieldWrapStep } from '../common/YieldWrapStep';
import { useWrappedNativeDeviceGuard } from '../common/useWrappedNativeDeviceGuard';
import { useWrappedNativePendingTx } from '../common/useWrappedNativePendingTx';

type WrapNativeTokenProps = {
    account: Account;
    token: YieldFlowDisplayToken & { contractAddress: string };
};

type BroadcastWrap = {
    txid: string;
    amount: string;
};

export const WrapNativeToken = ({ account, token }: WrapNativeTokenProps) => {
    const dispatch = useDispatch();
    const ensureDeviceReady = useWrappedNativeDeviceGuard();
    const [broadcast, setBroadcast] = useState<BroadcastWrap | null>(null);
    const methods = useForm<YieldFlowFormValues>({
        mode: 'onChange',
        defaultValues: {
            amountInput: '',
        },
    });

    const pendingTxStatus = useWrappedNativePendingTx(account, broadcast?.txid ?? null, 'wrap');

    const nativeSymbol = getNetworkDisplaySymbol(account.symbol);
    const nativeToken: YieldFlowDisplayToken = {
        networkSymbol: account.symbol,
        symbol: nativeSymbol,
        decimals: token.decimals,
    };

    const maxWrapAmount = BigNumber.max(
        0,
        new BigNumber(account.formattedBalance).minus(WETH_WRAP_GAS_RESERVE),
    ).toString();

    const amountInput = useWatch({ control: methods.control, name: 'amountInput' });
    const amount = new BigNumber(amountInput || '');
    const isAmountTooHigh = amount.gt(maxWrapAmount);
    const isAmountValid = amount.gt(0) && !isAmountTooHigh && methods.formState.isValid;

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
        methods.reset({ amountInput: '' });
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
        if (!(await ensureDeviceReady())) {
            return;
        }

        wrapMutation.mutate(wrapAmount);
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
                        nativeBalance={account.formattedBalance}
                        shouldShowReceivingRow={false}
                        isSubmitting={wrapMutation.isPending}
                        isSubmitDisabled={!isAmountValid}
                        warning={
                            isAmountTooHigh ? (
                                <YieldActionStepWarning isInsufficientFunds />
                            ) : undefined
                        }
                        pendingTransaction={
                            broadcast
                                ? { type: 'wrap', txid: broadcast.txid, amount: broadcast.amount }
                                : undefined
                        }
                        onMaxClick={() =>
                            methods.setValue('amountInput', maxWrapAmount, {
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
