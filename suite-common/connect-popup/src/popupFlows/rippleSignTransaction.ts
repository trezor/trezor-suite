import { CommonPopupFlow } from './CommonPopupFlow';
import { describeMiscCall } from '../methodInfo';

export class RippleSignTransaction extends CommonPopupFlow<'rippleSignTransaction'> {
    protected getMethodInfo = () => describeMiscCall('xrp', 'sign', 'Sign Ripple transaction');
}
