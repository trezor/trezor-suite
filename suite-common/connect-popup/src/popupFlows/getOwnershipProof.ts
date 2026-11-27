import { CommonPopupFlow } from './CommonPopupFlow';
import { describeCall, getBitcoinCoinInfos, getCoinPermissions, getRequests } from '../methodInfo';

export class GetOwnershipProof extends CommonPopupFlow<'getOwnershipProof'> {
    protected getMethodInfo = async () => {
        const requests = getRequests(this.payload);
        const coinInfos = await getBitcoinCoinInfos(requests);
        // Preauthorized proofs run under the coinjoin authorization of the device session.
        const isPreauthorized = requests.some(({ preauthorized }) => preauthorized);

        return describeCall(
            requests.length > 1 ? 'Export multiple ownership proofs' : 'Export ownership proof',
            getCoinPermissions('read_account_info', coinInfos).concat(
                isPreauthorized ? getCoinPermissions('internal', coinInfos) : [],
            ),
        );
    };
}
