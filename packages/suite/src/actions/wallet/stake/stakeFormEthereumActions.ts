import { type UnknownAction } from '@reduxjs/toolkit';
import { type ThunkDispatch } from 'redux-thunk';

import { type SelectedAccountRootState } from '@suite/account';
import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { type WithServices } from '@suite-common/redux-utils';
import {
    getStakeTxGasLimit,
    prepareClaimEthTx,
    prepareStakeEthTx,
    prepareUnstakeEthTx,
} from '@suite-common/staking';
import {
    calculate,
    composeStakingTransaction,
} from '@suite-common/staking/src/actions/stakeFormActions';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    MIN_ETH_AMOUNT_FOR_STAKING,
    MIN_ETH_BALANCE_FOR_STAKING,
    MIN_ETH_FOR_WITHDRAWALS,
    UNSTAKE_INTERCHANGES,
} from '@suite-common/wallet-constants';
import {
    type EthereumGetCurrentNonceThunkState,
    type WalletSettingsRootState,
    selectAddressDisplayType,
    stakeActions,
} from '@suite-common/wallet-core';
import { ethereumGetCurrentNonceThunk } from '@suite-common/wallet-core/src/send/sendFormEthereumThunks';
import {
    AddressDisplayOptions,
    type ComposeActionContext,
    type ExternalOutput,
    type PrecomposedTransaction,
    type PrecomposedTransactionFinal,
    type StakeFormState,
} from '@suite-common/wallet-types';
import {
    calculateTotalGasCost,
    fromEther,
    fromGwei,
    getAccountIdentity,
} from '@suite-common/wallet-utils';
import TrezorConnect, { type FeeLevel } from '@trezor/connect';

const calculateStakingTransaction = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
    compareWithAmount = true,
    symbol: NetworkSymbol,
): PrecomposedTransaction => {
    const totalGasCostInWei = calculateTotalGasCost(
        fromGwei(feeLevel.maxFeePerGas || feeLevel.feePerUnit).toWei(),
        feeLevel.feeLimit,
    );

    const stakingParams = {
        feeInBaseUnits: totalGasCostInWei,
        minBalanceForStakingInBaseUnits: fromEther(MIN_ETH_BALANCE_FOR_STAKING.toString()).toWei(),
        minAmountForStakingInBaseUnits: fromEther(MIN_ETH_AMOUNT_FOR_STAKING.toString()).toWei(),
        minAmountForWithdrawalInBaseUnits: fromEther(MIN_ETH_FOR_WITHDRAWALS.toString()).toWei(),
    };

    return calculate(availableBalance, output, feeLevel, compareWithAmount, symbol, stakingParams);
};

export const composeTransaction =
    (formValues: StakeFormState, formState: ComposeActionContext) => async () => {
        const { account, feeInfo } = formState;
        if (!account || !feeInfo) return;

        const amount = formValues.outputs[0]?.amount;

        if (!amount || amount === '0') return;

        // gasLimit calculation based on account.descriptor and amount
        const { stakeType } = formValues;
        const stakeTxGasLimit = await getStakeTxGasLimit({
            stakeType,
            from: account.descriptor,
            amount,
            symbol: account.symbol,
            identity: getAccountIdentity(account),
        });

        if (!stakeTxGasLimit.success) return stakeTxGasLimit.error;

        const customFeeLimit = stakeTxGasLimit.gasLimit;

        // FeeLevels are read-only
        const levels = customFeeLimit ? feeInfo.levels.map(l => ({ ...l })) : feeInfo.levels;
        const predefinedLevels = levels.filter(l => l.label !== 'custom');
        // update predefined levels with customFeeLimit (gasLimit from data size or erc20 transfer)
        if (customFeeLimit) {
            predefinedLevels.forEach(l => (l.feeLimit = customFeeLimit));
        }
        // in case when selectedFee is set to 'custom' construct this FeeLevel from values
        if (formValues.selectedFee === 'custom') {
            predefinedLevels.push({
                label: 'custom',
                feePerUnit: formValues.feePerUnit,
                feeLimit: formValues.feeLimit,
                maxFeePerGas: formValues.maxFeePerGas,
                maxPriorityFeePerGas: formValues.maxPriorityFeePerGas || '0',
                blocks: -1,
            });
        }

        return composeStakingTransaction(
            formValues,
            formState,
            predefinedLevels,
            calculateStakingTransaction,
            undefined,
            customFeeLimit,
        );
    };

type SignTransactionThunkState = DeviceRootState &
    EthereumGetCurrentNonceThunkState &
    SelectedAccountRootState &
    WalletSettingsRootState;

type SignTransactionThunkDeps = WithServices<DesktopAnalyticsDep>;

export const signTransaction =
    (formValues: StakeFormState, transactionInfo: PrecomposedTransactionFinal) =>
    async (
        dispatch: ThunkDispatch<SignTransactionThunkState, SignTransactionThunkDeps, UnknownAction>,
        getState: () => SignTransactionThunkState,
        extra: SignTransactionThunkDeps,
    ) => {
        const { selectedAccount } = getState().wallet;
        const device = selectSelectedDevice(getState());
        if (selectedAccount.status !== 'loaded' || !device || transactionInfo?.type !== 'final')
            return;

        const { account, network } = selectedAccount;
        if (account.networkType !== 'ethereum' || !network.chainId) return;

        const addressDisplayType = selectAddressDisplayType(getState());

        const { nonce } = await dispatch(
            ethereumGetCurrentNonceThunk({
                selectedAccount: account,
                rbfParams: formValues.rbfParams,
                fetchConfirmedNonce: true,
            }),
        ).unwrap();

        // Store the signed-with nonce (decimal) so the review modal can display it, mirroring the
        // Send flow. Set before ethereumSignTransaction fires the device button-request below.
        dispatch(stakeActions.setResolvedEthereumNonce(nonce));

        const identity = getAccountIdentity(account);

        // transform to TrezorConnect.ethereumSignTransaction params
        const { stakeType } = formValues;
        let txData;
        if (stakeType === 'stake') {
            const amount = formValues.outputs[0]?.amount ?? '0';

            txData = await prepareStakeEthTx({
                symbol: account.symbol,
                from: account.descriptor,
                identity,
                amount,
                gasPrice: transactionInfo.feePerByte,
                feeLimit: transactionInfo.feeLimit,
                maxFeePerGas: transactionInfo.maxFeePerGas,
                maxPriorityFeePerGas: transactionInfo.maxPriorityFeePerGas,
                nonce,
                chainId: network.chainId,
            });
        }
        if (stakeType === 'unstake') {
            const amount = formValues.outputs[0]?.amount ?? '0';

            txData = await prepareUnstakeEthTx({
                symbol: account.symbol,
                from: account.descriptor,
                identity,
                amount,
                gasPrice: transactionInfo.feePerByte,
                feeLimit: transactionInfo.feeLimit,
                maxFeePerGas: transactionInfo.maxFeePerGas,
                maxPriorityFeePerGas: transactionInfo.maxPriorityFeePerGas,
                nonce,
                chainId: network.chainId,
                interchanges: UNSTAKE_INTERCHANGES,
            });
        }
        if (stakeType === 'claim') {
            txData = await prepareClaimEthTx({
                symbol: account.symbol,
                from: account.descriptor,
                identity,
                gasPrice: transactionInfo.feePerByte,
                feeLimit: transactionInfo.feeLimit,
                maxFeePerGas: transactionInfo.maxFeePerGas,
                maxPriorityFeePerGas: transactionInfo.maxPriorityFeePerGas,
                nonce,
                chainId: network.chainId,
            });
        }

        if (!txData) {
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: 'Unknown stake action',
                }),
            );

            return;
        }

        if (!txData.success) {
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: txData.errorMessage,
                }),
            );

            return;
        }

        const signedTx = await TrezorConnect.ethereumSignTransaction({
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
                useEmptyPassphrase: device.useEmptyPassphrase,
            },
            path: account.path,
            transaction: txData.tx,
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
        });

        if (!signedTx.success) {
            extra.services.analytics.report({
                type: events.transactionCancelEvent.name,
                payload: {
                    txType: 'stake',
                    networkSymbol: account.symbol,
                },
            });

            // catch manual error from TransactionReviewModal
            if (signedTx.error.message === 'tx-cancelled') return;

            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: signedTx.error.message,
                }),
            );

            return;
        }

        return signedTx.payload.serializedTx;
    };
