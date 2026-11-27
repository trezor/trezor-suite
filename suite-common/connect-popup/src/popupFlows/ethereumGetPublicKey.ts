import { AddressConfirmationFlow } from './AddressConfirmationFlow';
import {
    describeCall,
    getCoinPermissions,
    getEthereumCoinInfos,
    getMultipleLabel,
    getRequests,
} from '../methodInfo';
import { getNetworkLabel } from '../methodTitles';

export class EthereumGetPublicKey extends AddressConfirmationFlow<'ethereumGetPublicKey'> {
    protected getMethodInfo = async () => {
        const networks = await getEthereumCoinInfos(getRequests(this.payload));

        return describeCall(
            getMultipleLabel({
                networks,
                getLabelOfNetwork: getNetworkLabel,
                single: 'Export #NETWORK public key',
                multipleOfNetwork: 'Export multiple #NETWORK public keys',
                multiple: 'Export multiple public keys',
            }),
            getCoinPermissions('read_xpub', networks),
        );
    };
}
