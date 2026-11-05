import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type FormOptions, type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import { getOriginalTxids, getPreviousTxids } from '@trezor/connect-common';

import { AbstractSignTransactionFlow } from './AbstractSignTransactionFlow';
import { type PopupFlowPayload, type PopupFlowResponse } from './CommonPopupFlow';

const fetchRefTransactions = async (payload: PopupFlowPayload<'signTransaction'>) => {
    const { coin, refTxs, account, inputs, outputs, identity, version, callId } = payload;

    if (!refTxs?.length && !account?.transactions?.length) {
        const prevTxids = getPreviousTxids(inputs, coin, { version });
        const origTxids = getOriginalTxids(inputs, outputs);
        const txs = [...prevTxids, ...origTxids];

        if (!txs.length) {
            return;
        }

        const hexOnly = true;
        const res = await TrezorConnect.blockchainGetTransactions({
            coin,
            txs,
            identity,
            hexOnly,
            callId,
        });

        if (res.success) {
            return res.payload;
        }
        if (res.error.code === 'Method_Cancel') {
            throw res.error;
        }
    }
};

export class SignTransaction extends AbstractSignTransactionFlow<'signTransaction'> {
    protected async preCall(txSigningPrecomposed?: PrecomposedTransactionFinal) {
        const [transactions] = await Promise.all([
            fetchRefTransactions(this.payload).catch(error => {
                if (error?.code === 'Method_Cancel') throw error;
                console.error('Error in Connect Popup %s hook:', this.method, error);
            }),
            super.preCall(txSigningPrecomposed),
        ]);
        const { account } = this.payload;

        // Pushed by postCall instead.
        return {
            ...this.payload,
            push: false,
            account: transactions ? { ...account, transactions } : account,
        };
    }

    protected prepareSigning(txSigningPrecomposed?: PrecomposedTransactionFinal) {
        if (!txSigningPrecomposed) return;

        const network = getNetwork(this.payload.coin as NetworkSymbol);
        if (!network) {
            throw new Error(`Network not supported`);
        }
        const accountPath = txSigningPrecomposed.inputs.find(i => i.address_n);
        if (!accountPath?.address_n) {
            throw new Error('Account not found in inputs');
        }

        this.selectSigningAccount(accountPath.address_n.slice(0, 3), network);

        // Send form options
        const options: FormOptions[] = [];
        if (this.payload.push) {
            options.push('broadcast');
        }
        if (this.payload.locktime) {
            options.push('bitcoinLocktime');
        }
        this.storePrecomposedTransaction(txSigningPrecomposed, {
            options,
            bitcoinLocktimeBlockHeight: '',
            bitcoinLocktimeDatetime: '',
        });
    }

    protected async postCall(response: PopupFlowResponse<'signTransaction'>) {
        const { push, coin, identity, callId } = this.payload;

        if (push && response.success && response.payload.serializedTx) {
            const res = await TrezorConnect.pushTransaction({
                coin,
                identity,
                tx: response.payload.serializedTx,
                callId,
            });

            if (!res.success) {
                // Fails the call the same way as if the signing itself failed
                throw res.error;
            }
        }

        return false;
    }
}
