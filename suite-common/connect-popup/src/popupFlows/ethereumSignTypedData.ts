import { isEvmTxSimulationSupported } from '@suite-common/tx-simulation';
import { asNetworkSymbol, getNetworkByEvmChainId } from '@suite-common/wallet-config';
import TrezorConnect, {
    type EthereumSignTypedData as EthereumSignTypedDataParams,
    type EthereumSignTypedDataTypes,
} from '@trezor/connect';

import { AbstractSignTransactionFlow } from './AbstractSignTransactionFlow';

export class EthereumSignTypedData extends AbstractSignTransactionFlow<'ethereumSignTypedData'> {
    protected async prepareSigning() {
        const { path, data } = this.payload;

        const chainId = Number(data.domain.chainId) || 1;
        this.selectSigningAccount(
            path,
            getNetworkByEvmChainId(chainId) || {
                symbol: asNetworkSymbol('eth'),
                name: 'Chain ID: ' + chainId,
                isHidden: true,
            },
        );

        // Only the chain ID is read, which the hash variant of the payload carries too.
        const payload = this.payload as EthereumSignTypedDataParams<EthereumSignTypedDataTypes>;

        // The simulation modal has nothing to render for a chain Blockaid can't scan, so opening it
        // would leave the call waiting on a confirmation the user never sees. Decided from the raw
        // payload, as the simulation is, not from the defaulted chain ID above.
        if (isEvmTxSimulationSupported({ method: this.method, payload })) {
            await this.simulateTransaction(TrezorConnect.ethereumGetAddress, path);
        }
    }
}
