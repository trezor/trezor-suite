import { AddressConfirmationFlow } from './AddressConfirmationFlow';
import { describeMiscAddresses, getRequests } from '../methodInfo';

export class CardanoGetAddress extends AddressConfirmationFlow<'cardanoGetAddress'> {
    protected getMethodInfo = () => {
        const requests = getRequests(this.payload);
        const paths = requests.map(({ addressParameters }) => addressParameters.path ?? []);

        return describeMiscAddresses('ada', 'Cardano', paths);
    };
}
