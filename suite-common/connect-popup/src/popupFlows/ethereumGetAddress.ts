import { AddressConfirmationFlow } from './AddressConfirmationFlow';
import {
    describeCall,
    getCoinPermissions,
    getEthereumCoinInfos,
    getMultipleLabel,
    getRequests,
} from '../methodInfo';
import { getNetworkLabel } from '../methodTitles';

export class EthereumGetAddress extends AddressConfirmationFlow<'ethereumGetAddress'> {
    protected getMethodInfo = async () => {
        const networks = await getEthereumCoinInfos(getRequests(this.payload));

        return describeCall(
            getMultipleLabel({
                networks,
                getLabelOfNetwork: getNetworkLabel,
                single: 'Export #NETWORK address',
                multipleOfNetwork: 'Export multiple #NETWORK addresses',
                multiple: 'Export multiple addresses',
            }),
            getCoinPermissions('read_address', networks),
        );
    };
}
