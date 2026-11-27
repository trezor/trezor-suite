import { CommonPopupFlow } from './CommonPopupFlow';
import { describeMiscCall } from '../methodInfo';

export class CardanoSignMessage extends CommonPopupFlow<'cardanoSignMessage'> {
    protected getMethodInfo = () => describeMiscCall('ada', 'sign', 'Sign Cardano message');
}
