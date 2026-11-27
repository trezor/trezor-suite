import { AddressConfirmationFlow } from './AddressConfirmationFlow';
import { describeMiscAddresses, getPaths } from '../methodInfo';

export class SolanaGetAddress extends AddressConfirmationFlow<'solanaGetAddress'> {
    protected getMethodInfo = () => describeMiscAddresses('sol', 'Solana', getPaths(this.payload));
}
