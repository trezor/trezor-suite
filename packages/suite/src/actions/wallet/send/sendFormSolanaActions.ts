import TrezorConnect from '@trezor/connect';
import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import {
    FormState,
    PrecomposedTransactionFinal,
    ComposeActionContext,
} from '@suite-common/wallet-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Dispatch, GetState } from 'src/types/suite';
import { getExternalComposeOutput, getLamportsFromSol } from '@suite-common/wallet-utils';
import BigNumber from 'bignumber.js';

const FEE_PER_SIGNATURE = new BigNumber(500);

// TODO(vl): Implement send-max
// TODO(vl), phase 2: Implement custom Prioritization Fees

// TODO(vl): Replace with appropriate call!
const getRecentBlockhash = async () => {
    const response = await fetch('https://api.devnet.solana.com', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getRecentBlockhash',
            params: [],
        }),
    });
    const { result } = await response.json();

    return result.value.blockhash;
};

export const composeTransaction =
    (formValues: FormState, formState: ComposeActionContext) => () => {
        const { account, network } = formState;
        const composeOutputs = getExternalComposeOutput(formValues, account, network);
        if (!composeOutputs) return; // no valid Output

        const { address, amount } = formValues.outputs[0];

        // TODO(vl), phase 2: account for token transfers -- should only count fee when transferring tokens
        const totalSpent = new BigNumber(amount)
            .times(new BigNumber(10 ** 9))
            .plus(FEE_PER_SIGNATURE)
            .toString();

        const feeObject = {
            normal: {
                type: 'final',
                totalSpent,
                fee: '500',
                feePerByte: '500',
                feeLimit: '500',
                bytes: 0,
                transaction: {
                    inputs: [],
                    outputsPermutation: [0],
                    outputs: [
                        {
                            address,
                            amount: new BigNumber(amount).times(new BigNumber(10 ** 9)).toString(),
                            script_type: 'PAYTOADDRESS',
                        },
                    ],
                },
                estimatedFeeLimit: '500',
            },
        };
        return Promise.resolve(feeObject);
    };

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

        const blockhash = await getRecentBlockhash();

        const tx = new Transaction({
            blockhash,
            lastValidBlockHeight: 50,
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
