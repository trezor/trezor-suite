import { CommonPopupFlow } from './CommonPopupFlow';
import { describeCall } from '../methodInfo';

export class TronComposeTransaction extends CommonPopupFlow<'tronComposeTransaction'> {
    protected getMethodInfo = () => describeCall('Compose Tron transaction');
}
