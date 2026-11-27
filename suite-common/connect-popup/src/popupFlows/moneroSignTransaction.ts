import { CommonPopupFlow } from './CommonPopupFlow';
import { describeMiscCall } from '../methodInfo';

export class MoneroSignTransaction extends CommonPopupFlow<'moneroSignTransaction'> {
    protected getMethodInfo = () => describeMiscCall('xmr', 'sign', 'Sign Monero transaction');
}
