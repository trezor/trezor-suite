import { CommonPopupFlow } from './CommonPopupFlow';
import { describeMiscCall } from '../methodInfo';

export class CardanoSignTransaction extends CommonPopupFlow<'cardanoSignTransaction'> {
    protected getMethodInfo = () => describeMiscCall('ada', 'sign', 'Sign Cardano transaction');
}
