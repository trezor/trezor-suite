import { getLabel } from '@trezor/connect-common/src/utils/pathUtils';

import { AddressConfirmationFlow } from './AddressConfirmationFlow';
import {
    describeCall,
    getBitcoinCoinInfos,
    getCoinPermissions,
    getMultipleLabel,
    getRequests,
} from '../methodInfo';

export class GetAddress extends AddressConfirmationFlow<'getAddress'> {
    protected getMethodInfo = async () => {
        const coinInfos = await getBitcoinCoinInfos(getRequests(this.payload));

        return describeCall(
            getMultipleLabel({
                networks: coinInfos,
                getLabelOfNetwork: getLabel,
                single: 'Export #NETWORK address',
                multipleOfNetwork: 'Export multiple #NETWORK addresses',
                multiple: 'Export multiple addresses',
            }),
            getCoinPermissions('read_address', coinInfos),
        );
    };
}
