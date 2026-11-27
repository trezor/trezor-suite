import { getNetwork } from '@suite-common/wallet-config';
import TrezorConnect from '@trezor/connect';

import { AbstractSignTransactionFlow } from './AbstractSignTransactionFlow';
import { describeMiscCall } from '../methodInfo';

export class SolanaSignTransaction extends AbstractSignTransactionFlow<'solanaSignTransaction'> {
    protected getMethodInfo = () => describeMiscCall('sol', 'sign', 'Sign Solana transaction');

    protected async prepareSigning() {
        const { path, additionalInfo } = this.payload;

        this.selectSigningAccount(path, getNetwork(additionalInfo?.isDevnet ? 'dsol' : 'sol'));

        // Connect only precomposes when it can decode the message; the simulation does not
        // depend on it, so a WalletConnect call still gets scanned without one.
        const precomposed = await TrezorConnect.solanaPrecomposeSignTransaction(this.payload);
        if (precomposed.success) {
            this.storePrecomposedTransaction(precomposed.payload);
        }
        await this.simulateTransaction(TrezorConnect.solanaGetAddress, path);
    }
}
