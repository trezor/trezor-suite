import { CommonPopupFlow } from './CommonPopupFlow';
import { describeCall } from '../methodInfo';

export class CipherKeyValue extends CommonPopupFlow<'cipherKeyValue'> {
    protected getMethodInfo = () => describeCall('Cipher key value', [{ permission: 'sign' }]);
}
