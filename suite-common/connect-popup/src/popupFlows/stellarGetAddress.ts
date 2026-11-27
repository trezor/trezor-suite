import { AddressConfirmationFlow } from './AddressConfirmationFlow';
import { describeMiscAddresses, getPaths } from '../methodInfo';

export class StellarGetAddress extends AddressConfirmationFlow<'stellarGetAddress'> {
    protected getMethodInfo = () => describeMiscAddresses('xlm', 'Stellar', getPaths(this.payload));
}
