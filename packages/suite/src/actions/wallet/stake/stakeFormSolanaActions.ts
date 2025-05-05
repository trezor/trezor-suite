import { address } from '@solana/kit';

import { notificationsActions } from '@suite-common/toast-notifications';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    MIN_SOL_AMOUNT_FOR_STAKING,
    MIN_SOL_BALANCE_FOR_STAKING,
    MIN_SOL_FOR_WITHDRAWALS,
    SOL_STAKING_OPERATION_FEE,
} from '@suite-common/wallet-constants';
import { ComposeActionContext, selectSelectedDevice } from '@suite-common/wallet-core';
import {
    Account,
    AddressDisplayOptions,
    BlockchainNetworks,
    EstimatedFee,
    ExternalOutput,
    PrecomposedTransaction,
    PrecomposedTransactionFinal,
    PrepareStakeSolTxResponse,
    SelectedAccountStatus,
    StakeFormState,
} from '@suite-common/wallet-types';
import { networkAmountToSmallestUnit } from '@suite-common/wallet-utils';
import { Fee } from '@trezor/blockchain-link-types/src/blockbook';
import TrezorConnect, { FeeLevel } from '@trezor/connect';
import { EventType, analytics } from '@trezor/suite-analytics';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { selectAddressDisplayType } from 'src/reducers/suite/suiteReducer';
import { Dispatch, GetState } from 'src/types/suite';
import {
    prepareClaimSolTx,
    prepareStakeSolTx,
    prepareUnstakeSolTx,
} from 'src/utils/suite/solanaStaking';

import { calculate, composeStakingTransaction } from './stakeFormActions';

const calculateTransaction = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
    compareWithAmount = true,
    symbol: NetworkSymbol,
    estimatedFee?: EstimatedFee,
): PrecomposedTransaction => {
    const feeInLamports =
        estimatedFee?.payload?.feePerTx ?? new BigNumber(SOL_STAKING_OPERATION_FEE).toString();

    const stakingParams = {
        feeInBaseUnits: feeInLamports,
        minBalanceForStakingInBaseUnits: networkAmountToSmallestUnit(
            MIN_SOL_BALANCE_FOR_STAKING.toString(),
            symbol,
        ),
        minAmountForStakingInBaseUnits: networkAmountToSmallestUnit(
            MIN_SOL_AMOUNT_FOR_STAKING.toString(),
            symbol,
        ),
        minAmountForWithdrawalInBaseUnits: networkAmountToSmallestUnit(
            MIN_SOL_FOR_WITHDRAWALS.toString(),
            symbol,
        ),
    };

    const estimatedFeeLevel = { ...feeLevel, ...estimatedFee };

    return calculate(
        availableBalance,
        output,
        estimatedFeeLevel,
        compareWithAmount,
        symbol,
        stakingParams,
        estimatedFee,
    );
};

const getTransactionData = async (
    formValues: StakeFormState,
    selectedAccount: SelectedAccountStatus,
    blockchain: BlockchainNetworks,
    estimatedFee?: Fee[number],
) => {
    const { stakeType } = formValues;

    if (selectedAccount.status !== 'loaded' || selectedAccount.account.networkType !== 'solana') {
        return;
    }

    const { account } = selectedAccount;

    const selectedBlockchain = blockchain[account.symbol];

    let txData;
    if (stakeType === 'stake') {
        txData = await prepareStakeSolTx({
            from: account.descriptor,
            path: account.path,
            amount: formValues.outputs[0].amount,
            symbol: account.symbol,
            selectedBlockchain,
            estimatedFee,
        });
    }

    if (stakeType === 'unstake') {
        txData = await prepareUnstakeSolTx({
            from: account.descriptor,
            path: account.path,
            amount: formValues.outputs[0].amount,
            symbol: account.symbol,
            selectedBlockchain,
            estimatedFee,
        });
    }

    if (stakeType === 'claim') {
        txData = await prepareClaimSolTx({
            from: account.descriptor,
            path: account.path,
            symbol: account.symbol,
            selectedBlockchain,
            estimatedFee,
        });
    }

    return txData;
};

async function estimateFee(
    account: Account,
    txData?: PrepareStakeSolTxResponse,
): Promise<EstimatedFee> {
    if (!txData?.success) return { success: false };

    const estimatedFee = await TrezorConnect.blockchainEstimateFee({
        coin: account.symbol,
        request: {
            specific: {
                data: txData.tx.txShim.serialize(),
                newAccountProgramName: 'staking',
            },
        },
    });

    if (estimatedFee?.success) {
        const { levels } = estimatedFee.payload;

        return { success: true, payload: levels[0] };
    }

    return { success: false };
}

export const composeTransaction =
    (formValues: StakeFormState, formState: ComposeActionContext) =>
    async (_: Dispatch, getState: GetState) => {
        const { selectedAccount, blockchain } = getState().wallet;

        if (selectedAccount.status !== 'loaded') return;

        const { account } = selectedAccount;
        const txData = await getTransactionData(formValues, selectedAccount, blockchain);

        let estimatedFee;
        // it is not needed to estimate fee for empty input
        if (formValues.cryptoInput) {
            estimatedFee = await estimateFee(account, txData);
        }

        const { feeInfo } = formState;
        if (!feeInfo) return;

        const { levels } = feeInfo;
        const predefinedLevels = levels.filter(l => l.label !== 'custom');

        return composeStakingTransaction(
            formValues,
            formState,
            predefinedLevels,
            calculateTransaction,
            estimatedFee,
            undefined,
        );
    };

export const signTransaction =
    (formValues: StakeFormState, transactionInfo: PrecomposedTransactionFinal) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const { selectedAccount, blockchain } = getState().wallet;

        const device = selectSelectedDevice(getState());
        if (
            selectedAccount.status !== 'loaded' ||
            !device ||
            !transactionInfo ||
            transactionInfo.type !== 'final'
        ) {
            return;
        }

        const { account } = selectedAccount;
        if (account.networkType !== 'solana') {
            return;
        }

        const addressDisplayType = selectAddressDisplayType(getState());
        const estimatedFee = {
            feePerTx: transactionInfo.fee,
            feeLimit: transactionInfo.feeLimit,
            feePerUnit: transactionInfo.feePerByte,
        };

        const txData = await getTransactionData(
            formValues,
            selectedAccount,
            blockchain,
            estimatedFee,
        );

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

        const signedTx = await TrezorConnect.solanaSignTransaction({
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
            },
            useEmptyPassphrase: device.useEmptyPassphrase,
            path: account.path,
            serializedTx: txData.tx.txShim.serializeMessage(),
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
        });

        if (!signedTx.success) {
            analytics.report({
                type: EventType.TransactionCancel,
                payload: {
                    txType: 'stake',
                    networkSymbol: account.symbol,
                },
            });

            // catch manual error from TransactionReviewModal
            if (signedTx.payload.error === 'tx-cancelled') {
                return;
            }

            if (signedTx.payload.error !== 'tx-timeout') {
                dispatch(
                    notificationsActions.addToast({
                        type: 'sign-tx-error',
                        error: signedTx.payload.error,
                    }),
                );
            }

            return signedTx;
        }

        txData.tx.txShim.addSignature(address(account.descriptor), signedTx.payload.signature);

        return txData.tx.txShim.serialize();
    };
