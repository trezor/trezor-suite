import { AddressConfirmationFlow } from './AddressConfirmationFlow';
import { describeMiscAddresses, getPaths } from '../methodInfo';

export class RippleGetAddress extends AddressConfirmationFlow<'rippleGetAddress'> {
    protected getMethodInfo = () => describeMiscAddresses('xrp', 'Ripple', getPaths(this.payload));
}
