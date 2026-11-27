import { CommonPopupFlow } from './CommonPopupFlow';
import { describeCall } from '../methodInfo';

export class ComposePsbt extends CommonPopupFlow<'composePsbt'> {
    protected getMethodInfo = () => describeCall('Compose PSBT transaction');
}
