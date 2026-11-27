import { CommonPopupFlow } from './CommonPopupFlow';
import { describeCall } from '../methodInfo';

export class GetDeviceState extends CommonPopupFlow<'getDeviceState'> {
    protected getMethodInfo = () => describeCall('', [{ permission: 'read_features' }]);
}
