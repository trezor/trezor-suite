import { AddressConfirmationFlow } from './AddressConfirmationFlow';
import { describeMiscCall } from '../methodInfo';

export class MoneroGetAddress extends AddressConfirmationFlow<'moneroGetAddress'> {
    protected getMethodInfo = () =>
        describeMiscCall('xmr', 'read_address', 'Export Monero address');
}
