import { AddressConfirmationFlow } from './AddressConfirmationFlow';
import { describeMiscPublicKeys, getPaths } from '../methodInfo';

export class CardanoGetPublicKey extends AddressConfirmationFlow<'cardanoGetPublicKey'> {
    protected getMethodInfo = () =>
        describeMiscPublicKeys('ada', 'Cardano', getPaths(this.payload));
}
