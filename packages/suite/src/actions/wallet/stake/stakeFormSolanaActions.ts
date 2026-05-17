import { asTypedDesktopAnalytics, events } from '@suite/analytics';
import { selectSelectedDevice } from '@suite-common/device';
import { type ExtraDependencies } from '@suite-common/redux-utils';
import {
    calculate,
    composeStakingTransaction,
} from '@suite-common/staking/src/actions/stakeFormActions';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectAddressDisplayType } from '@suite-common/wallet-core';
import {
    type Account,
    AddressDisplayOptions,
    type BlockchainNetworks,
    type ComposeActionContext,
    type ExternalOutput,
    type PrecomposedLevels,
    type PrecomposedTransaction,
    type PrecomposedTransactionFinal,
    type SelectedAccountStatus,
    type StakeFormState,
} from '@suite-common/wallet-types';
import { networkAmountToSmallestUnit } from '@suite-common/wallet-utils';
import { type BlockbookFee as Fee } from '@trezor/blockchain-link-types';
import {
    MIN_SOL_AMOUNT_FOR_STAKING,
    MIN_SOL_BALANCE_FOR_STAKING,
    MIN_SOL_FOR_WITHDRAWALS,
    SOL_STAKING_OPERATION_FEE,
    supportedSolanaNetworkSymbols,
} from '@trezor/coins-solana/constants';
import solana from '@trezor/coins-solana/runtime';
import type {
    EstimatedFee,
    PrepareStakeSolTxResponse,
    SolanaTxMeta,
} from '@trezor/coins-solana/types';
import TrezorConnect, { type FeeLevel } from '@trezor/connect';
import { getSuiteVersion } from '@trezor/env-utils';
import { BigNumber, isArrayMember } from '@trezor/utils';

import { type Dispatch, type GetState } from 'src/types/suite';

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

    const estimatedFeeLevel = { ...feeLevel, ...estimatedFee?.payload };

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

    if (!isArrayMember(account.symbol, supportedSolanaNetworkSymbols)) {
        return;
    }

    const selectedBlockchain = blockchain[account.symbol];

    const {
        selectSolanaConnection,
        selectSolanaValidator,
        prepareStakeSolTx,
        prepareUnstakeSolTx,
        prepareClaimSolTx,
    } = await solana();

    const connection = selectSolanaConnection(
        selectedBlockchain.url,
        `Trezor Suite ${getSuiteVersion()}`,
    );
    const validator = selectSolanaValidator(account.symbol);

    let txData;
    if (stakeType === 'stake') {
        txData = await prepareStakeSolTx({
            from: account.descriptor,
            amount: formValues.outputs[0].amount,
            connection,
            validator,
            estimatedFee,
        });
    }

    if (stakeType === 'unstake') {
        txData = await prepareUnstakeSolTx({
            from: account.descriptor,
            amount: formValues.outputs[0].amount,
            connection,
            validator,
            estimatedFee,
        });
    }

    if (stakeType === 'claim') {
        txData = await prepareClaimSolTx({
            from: account.descriptor,
            connection,
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
                data: txData.txShim.serialize(),
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

const applySolanaTxMeta = (
    composed: PrecomposedLevels,
    solanaTxMeta: SolanaTxMeta,
): PrecomposedLevels =>
    Object.fromEntries(
        Object.entries(composed).map(([key, tx]) => {
            if (tx.type === 'error') return [key, tx];

            const nextTx = { ...tx, solanaTxMeta };

            if (tx.type === 'final') {
                const totalSpent = new BigNumber(solanaTxMeta.deviceAmountLamports)
                    .plus(solanaTxMeta.feeIncludingRentLamports)
                    .toString();

                return [
                    key,
                    {
                        ...nextTx,
                        fee: solanaTxMeta.feeIncludingRentLamports,
                        totalSpent,
                    },
                ];
            }

            return [key, nextTx];
        }),
    );

export const composeTransaction =
    (formValues: StakeFormState, formState: ComposeActionContext) =>
    async (_: Dispatch, getState: GetState) => {
        const { selectedAccount, blockchain } = getState().wallet;

        if (selectedAccount.status !== 'loaded') return;

        const { account } = selectedAccount;
        const txData = await getTransactionData(formValues, selectedAccount, blockchain);

        const { amount } = formValues.outputs[0];

        if (!amount || amount === '0') return;

        const estimatedFee = await estimateFee(account, txData);

        const { feeInfo } = formState;
        if (!feeInfo) return;

        const { levels } = feeInfo;
        const predefinedLevels = levels.filter(l => l.label !== 'custom');

        const composed = composeStakingTransaction(
            formValues,
            formState,
            predefinedLevels,
            calculateTransaction,
            estimatedFee,
            undefined,
        );
        if (!composed) return;

        if (estimatedFee.success && estimatedFee.payload) {
            const txDataWithFee = await getTransactionData(
                formValues,
                selectedAccount,
                blockchain,
                estimatedFee.payload,
            );
            const solanaTxMeta = txDataWithFee?.success ? txDataWithFee.solanaTxMeta : undefined;

            if (solanaTxMeta) {
                return applySolanaTxMeta(composed, solanaTxMeta);
            }
        }

        return composed;
    };

export const signTransaction =
    (formValues: StakeFormState, transactionInfo: PrecomposedTransactionFinal) =>
    async (dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { selectedAccount, blockchain } = getState().wallet;

        const device = selectSelectedDevice(getState());
        if (selectedAccount.status !== 'loaded' || !device || transactionInfo?.type !== 'final') {
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
                useEmptyPassphrase: device.useEmptyPassphrase,
            },
            path: account.path,
            serializedTx: txData.txShim.serializeMessage(),
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
        });

        if (!signedTx.success) {
            asTypedDesktopAnalytics(extra.services.analytics).report({
                type: events.transactionCancelEvent.name,
                payload: {
                    txType: 'stake',
                    networkSymbol: account.symbol,
                },
            });

            // catch manual error from TransactionReviewModal
            if (signedTx.error.message === 'tx-cancelled') {
                return;
            }

            if (signedTx.error.message !== 'tx-timeout') {
                dispatch(
                    notificationsActions.addToast({
                        type: 'sign-tx-error',
                        error: signedTx.error.message,
                    }),
                );
            }

            return signedTx;
        }

        const { address } = await solana();

        txData.txShim.addSignature(address(account.descriptor), signedTx.payload.signature);

        return txData.txShim.serialize();
    };
