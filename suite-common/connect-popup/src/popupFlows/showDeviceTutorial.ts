import { CommonPopupFlow } from './CommonPopupFlow';
import { describeCall } from '../methodInfo';

export class ShowDeviceTutorial extends CommonPopupFlow<'showDeviceTutorial'> {
    protected getMethodInfo = () => describeCall('Show device tutorial');
}
