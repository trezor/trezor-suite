import { CommonPopupFlow } from './CommonPopupFlow';
import { describeCall } from '../methodInfo';

export class GetFeatures extends CommonPopupFlow<'getFeatures'> {
    protected getMethodInfo = () => describeCall('', [{ permission: 'read_features' }]);
}
