import { CommonPopupFlow } from './CommonPopupFlow';
import { describeCall } from '../methodInfo';

export class UnlockPath extends CommonPopupFlow<'unlockPath'> {
    protected getMethodInfo = () => describeCall('', [{ permission: 'read_xpub' }]);
}
