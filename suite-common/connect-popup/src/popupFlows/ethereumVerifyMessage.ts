import { CommonPopupFlow } from './CommonPopupFlow';
import { describeCall } from '../methodInfo';

export class EthereumVerifyMessage extends CommonPopupFlow<'ethereumVerifyMessage'> {
    protected getMethodInfo = () =>
        describeCall('Verify message', [{ permission: 'verify_message' }]);
}
