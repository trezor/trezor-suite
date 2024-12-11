import TrezorConnect from '@trezor/connect';
import { selectDevice } from '@suite-common/wallet-core';

import { useDispatch, useSelector } from '../../hooks/suite';
import { getDeviceState } from '../../reducers/suite/contactsReducer';
import * as contactsActions from '../../actions/suite/contactsActions';

export const useAddContactButton = () => {
    const dispatch = useDispatch();
    const device = useSelector(selectDevice);

    return async () => {
        const deviceState = device && getDeviceState(device);
        if (!deviceState) {
            alert('No device selected or device unacquired');

            return;
        }

        const address = prompt("Recipient's address or public key");
        const label = prompt('Label for this recipient');

        if (!address || !label) {
            alert('Missing data');

            return;
        }

        const message = `${label}/${address}`;

        const response = await TrezorConnect.signMessage({
            device,
            path: "m/44'/1'/0'/0/0",
            coin: 'test',
            message,
            useEmptyPassphrase: device.useEmptyPassphrase,
        });

        if (!response.success) {
            alert(`Signing failed: ${response.payload.error}`);

            return;
        }

        const { signature } = response.payload;

        const contact = { address, label, signature, deviceState };
        dispatch(contactsActions.addContact(contact));
    };
};
