import TrezorConnect from '@trezor/connect';
import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import {
    FormState,
    PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Dispatch, GetState } from 'src/types/suite';
import {
    getLamportsFromSol,
} from '@suite-common/wallet-utils';

export const signTransaction =
    (formValues: FormState, transactionInfo: PrecomposedTransactionFinal) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const { selectedAccount } = getState().wallet;
        const { device } = getState().suite;

        if (
            selectedAccount.status !== 'loaded' ||
            !device ||
            !transactionInfo ||
            transactionInfo.type !== 'final'
        )
            return;

        const { account, network } = selectedAccount;
        if (account.networkType !== 'solana' || !network.chainId) return;

        const blockhash = getState().wallet.blockchain.sol.blockHash;

        // The last block height for which the transaction will be considered valid, after which it can no longer be processed.
        // The current block time is set to 800ms, meaning this transaction should be valid when submitted within for 40 seconds
        // For more information see: https://docs.solana.com/cluster/synchronization
        const lastValidBlockHeight = 50;

        const tx = new Transaction({
            blockhash,
            lastValidBlockHeight,
            feePayer: new PublicKey(account.descriptor),
        }).add(
            SystemProgram.transfer({
                fromPubkey: new PublicKey(account.descriptor),
                toPubkey: new PublicKey(formValues.outputs[0].address),
                lamports: getLamportsFromSol(formValues.outputs[0].amount),
            }),
        );
        const serializedTx = tx.serializeMessage().toString('hex');

        const signature = await TrezorConnect.solanaSignTransaction({
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
            },
            path: account.path,
            serializedTx,
        });

        if (!signature.success) {
            // catch manual error from ReviewTransaction modal
            if (signature.payload.error === 'tx-cancelled') return;
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: signature.payload.error,
                }),
            );
            return;
        }

        tx.addSignature(
            new PublicKey(account.descriptor),
            Buffer.from(signature.payload.signature, 'hex'),
        );
        const signedTx = tx.serialize().toString('hex');

        return signedTx;
    };
