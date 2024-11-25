import { BigNumber } from '@trezor/utils/src/bigNumber';
import TrezorConnect, { FeeLevel } from '@trezor/connect';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getPubKeyFromAddress, toLamports } from '@suite-common/wallet-utils';
import {
    StakeFormState,
    PrecomposedTransaction,
    PrecomposedTransactionFinal,
    ExternalOutput,
    AddressDisplayOptions,
} from '@suite-common/wallet-types';
import { selectDevice, ComposeActionContext } from '@suite-common/wallet-core';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    MIN_SOL_AMOUNT_FOR_STAKING,
    MIN_SOL_BALANCE_FOR_STAKING,
    MIN_SOL_FOR_WITHDRAWALS,
} from '@suite-common/wallet-constants';

import { Dispatch, GetState } from 'src/types/suite';
import { selectAddressDisplayType } from 'src/reducers/suite/suiteReducer';
import { prepareStakeSolTx } from 'src/utils/suite/solanaStaking';

import { calculate, composeStakingTransaction } from './stakeFormActions';

const calculateTransaction = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
    compareWithAmount = true,
    symbol: NetworkSymbol,
): PrecomposedTransaction => {
    const feeInLamports = new BigNumber(feeLevel.feePerTx ?? '0').toString();

    const stakingParams = {
        feeInBaseUnits: feeInLamports,
        minBalanceForStakingInBaseUnits: toLamports(MIN_SOL_BALANCE_FOR_STAKING),
        minAmountForStakingInBaseUnits: toLamports(MIN_SOL_AMOUNT_FOR_STAKING),
        minAmountForWithdrawalInBaseUnits: toLamports(MIN_SOL_FOR_WITHDRAWALS),
    };

    return calculate(availableBalance, output, feeLevel, compareWithAmount, symbol, stakingParams);
};

export const composeTransaction =
    (formValues: StakeFormState, formState: ComposeActionContext) => () => {
        const { feeInfo } = formState;
        if (!feeInfo) return;

        const { levels } = feeInfo;
        const predefinedLevels = levels.filter(l => l.label !== 'custom');

        return composeStakingTransaction(
            formValues,
            formState,
            predefinedLevels,
            calculateTransaction,
            undefined,
        );
    };

export const signTransaction =
    (formValues: StakeFormState, transactionInfo: PrecomposedTransactionFinal) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const { selectedAccount } = getState().wallet;

        const device = selectDevice(getState());
        if (
            selectedAccount.status !== 'loaded' ||
            !device ||
            !transactionInfo ||
            transactionInfo.type !== 'final'
        )
            return;

        const { account } = selectedAccount;
        if (account.networkType !== 'solana') return;

        const addressDisplayType = selectAddressDisplayType(getState());

        // TODO: add solana specific stakeType
        const { stakeType } = formValues;

        let txData;
        if (stakeType === 'stake') {
            txData = await prepareStakeSolTx({
                from: account.descriptor,
                path: account.path,
                amount: formValues.outputs[0].amount,
                symbol: account.symbol,
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

        const signedTx = await TrezorConnect.solanaSignTransaction({
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
            },
            useEmptyPassphrase: device.useEmptyPassphrase,
            path: account.path,
            serializedTx: txData.tx.serializedTx,
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
        });

        if (!signedTx.success) {
            // catch manual error from TransactionReviewModal
            if (signedTx.payload.error === 'tx-cancelled') return;
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: signedTx.payload.error,
                }),
            );

            return;
        }

        const signerPubKey = await getPubKeyFromAddress(account.descriptor);

        txData.tx.versionedTx.addSignature(
            signerPubKey,
            Uint8Array.from(Buffer.from(signedTx.payload.signature, 'hex')),
        );

        const serializedVersiondeTx = txData.tx.versionedTx.serialize();
        const signedSerializedTx = Buffer.from(serializedVersiondeTx).toString('hex');

        return signedSerializedTx;
    };
