import { CommonPopupFlow } from './CommonPopupFlow';
import { describeCall } from '../methodInfo';

export class RequestLogin extends CommonPopupFlow<'requestLogin'> {
    protected getMethodInfo = () => describeCall('Login', [{ permission: 'sign' }]);

    protected preCall() {
        return { ...this.payload, origin: this.source.origin };
    }
}
