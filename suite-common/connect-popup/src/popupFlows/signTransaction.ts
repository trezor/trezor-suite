import { type NetworkSymbol, asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { selectConsensusBranchId } from '@suite-common/wallet-core';
import { type FormOptions, type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { TrezorBlockchain } from '@trezor/blockchain-core';
import { getOriginalTxids, getPreviousTxids } from '@trezor/connect-common';
import { promiseRaceWithSignal } from '@trezor/utils';

import { AbstractSignTransactionFlow } from './AbstractSignTransactionFlow';
import { type PopupFlowPayload, type PopupFlowResponse } from './CommonPopupFlow';

const fetchRefTransactions = async (payload: PopupFlowPayload<'signTransaction'>) => {
    const { coin, refTxs, account, inputs, outputs, identity, version } = payload;

    if (!refTxs?.length && !account?.transactions?.length) {
        const prevTxids = getPreviousTxids(inputs, coin, { version });
        const origTxids = getOriginalTxids(inputs, outputs);
        const txs = [...prevTxids, ...origTxids];

        if (!txs.length) {
            return;
        }

        const hexOnly = true;
        const res = await TrezorBlockchain.getTransactions({ coin, txs, identity, hexOnly });

        if (res.success) {
            return res.payload;
        }
    }
};

export class SignTransaction extends AbstractSignTransactionFlow<'signTransaction'> {
    protected async preCall(txSigningPrecomposed?: PrecomposedTransactionFinal) {
        const [transactions] = await Promise.all([
            promiseRaceWithSignal(
                fetchRefTransactions(this.payload).catch(error => {
                    console.error('Error in Connect Popup %s hook:', this.method, error);
                }),
                this.signal,
            ),
            super.preCall(txSigningPrecomposed),
        ]);
        const { account, coin, branchId } = this.payload;
        // Of Suite's networks, only Zcash takes a branch ID; firmware rejects it for the others.
        const consensusBranchId =
            coin === 'zec'
                ? selectConsensusBranchId(this.getState(), asNetworkSymbol(coin))
                : undefined;

        // Pushed by postCall instead.
        return {
            ...this.payload,
            push: false,
            account: transactions ? { ...account, transactions } : account,
            branchId: branchId ?? consensusBranchId,
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
        const { push, coin, identity } = this.payload;

        if (push && response.success && response.payload.serializedTx) {
            const tx = response.payload.serializedTx;
            const res = await promiseRaceWithSignal(
                TrezorBlockchain.pushTransaction({ coin, identity, tx }),
                this.signal,
            );

            if (!res.success) {
                // Fails the call the same way as if the signing itself failed
                throw res.error;
            }
        }

        return false;
    }
}
