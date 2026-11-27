import { CommonPopupFlow } from './CommonPopupFlow';
import { describeMiscCall } from '../methodInfo';

export class MoneroKeyImageSync extends CommonPopupFlow<'moneroKeyImageSync'> {
    protected getMethodInfo = () =>
        describeMiscCall(
            'xmr',
            'read_account_info',
            'Export Monero key images for spent output tracking',
        );
}
