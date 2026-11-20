import { CommonPopupFlow } from './CommonPopupFlow';

export class RequestLogin extends CommonPopupFlow<'requestLogin'> {
    protected preCall() {
        return { ...this.payload, origin: this.source.origin };
    }
}
