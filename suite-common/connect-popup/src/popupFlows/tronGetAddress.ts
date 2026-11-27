import { AddressConfirmationFlow } from './AddressConfirmationFlow';
import { describeMiscAddresses, getPaths } from '../methodInfo';

export class TronGetAddress extends AddressConfirmationFlow<'tronGetAddress'> {
    protected getMethodInfo = () => describeMiscAddresses('trx', 'Tron', getPaths(this.payload));
}
