import { asNetworkSymbol } from '@suite-common/wallet-config';
import { selectCardanoProtocolParameters } from '@suite-common/wallet-core';

import { CommonPopupFlow } from './CommonPopupFlow';
import { describeCall } from '../methodInfo';

export class CardanoComposeTransaction extends CommonPopupFlow<'cardanoComposeTransaction'> {
    protected getMethodInfo = () => describeCall('Compose Cardano transaction');

    protected preCall() {
        const { protocolParameters, testnet } = this.payload;
        const symbol = asNetworkSymbol(testnet ? 'tada' : 'ada');

        return {
            ...this.payload,
            protocolParameters:
                protocolParameters ?? selectCardanoProtocolParameters(this.getState(), symbol),
        };
    }
}
