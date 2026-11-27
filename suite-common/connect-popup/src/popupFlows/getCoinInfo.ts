import { CommonPopupFlow } from './CommonPopupFlow';
import { describeCall } from '../methodInfo';

export class GetCoinInfo extends CommonPopupFlow<'getCoinInfo'> {
    protected getMethodInfo = () => describeCall('');
}
