import { CommonPopupFlow } from './CommonPopupFlow';
import { describeCall, getBitcoinCoinInfos, getCoinPermissions, getRequests } from '../methodInfo';

export class GetOwnershipId extends CommonPopupFlow<'getOwnershipId'> {
    protected getMethodInfo = async () => {
        const requests = getRequests(this.payload);
        const coinInfos = await getBitcoinCoinInfos(requests);

        return describeCall(
            requests.length > 1 ? 'Export multiple ownership proof ids' : 'Export ownership id',
            getCoinPermissions('read_account_info', coinInfos),
        );
    };
}
