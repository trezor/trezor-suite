import { getNetwork } from '@suite-common/wallet-config';
import TrezorConnect from '@trezor/connect';

import { AbstractSignTransactionFlow } from './AbstractSignTransactionFlow';

export class StellarSignTransaction extends AbstractSignTransactionFlow<'stellarSignTransaction'> {
    protected async prepareSigning() {
        // Only the XDR form can be scanned; structured operations would need re-encoding first.
        if (!('xdrBase64' in this.payload)) {
            return;
        }

        const { path, testnet } = this.payload;

        this.selectSigningAccount(path, getNetwork(testnet ? 'txlm' : 'xlm'));

        await this.simulateTransaction(TrezorConnect.stellarGetAddress, path);
    }
}
