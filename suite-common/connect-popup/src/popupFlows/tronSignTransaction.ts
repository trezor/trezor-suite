import { CommonPopupFlow } from './CommonPopupFlow';
import { describeMiscCall } from '../methodInfo';

export class TronSignTransaction extends CommonPopupFlow<'tronSignTransaction'> {
    protected getMethodInfo = () => describeMiscCall('trx', 'sign', 'Sign Tron transaction');
}
