import { getNetwork } from '@suite-common/wallet-config';
import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import { AbstractSignTransactionFlow } from './AbstractSignTransactionFlow';

export class SolanaSignTransaction extends AbstractSignTransactionFlow<'solanaSignTransaction'> {
    protected async prepareSigning(txSigningPrecomposed?: PrecomposedTransactionFinal) {
        const { path, additionalInfo } = this.payload;

        this.selectSigningAccount(path, getNetwork(additionalInfo?.isDevnet ? 'dsol' : 'sol'));

        // Connect only precomposes when it can decode the message; the simulation does not
        // depend on it, so a WalletConnect call still gets scanned without one.
        if (txSigningPrecomposed) {
            this.storePrecomposedTransaction(txSigningPrecomposed);
        }
        await this.simulateTransaction(TrezorConnect.solanaGetAddress, path);
    }
}
