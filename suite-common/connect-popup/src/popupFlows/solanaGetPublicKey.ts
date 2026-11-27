import { AddressConfirmationFlow } from './AddressConfirmationFlow';
import { describeMiscPublicKeys, getPaths } from '../methodInfo';

export class SolanaGetPublicKey extends AddressConfirmationFlow<'solanaGetPublicKey'> {
    protected getMethodInfo = () => describeMiscPublicKeys('sol', 'Solana', getPaths(this.payload));
}
