import TrezorConnect from '@trezor/connect';
import { selectDevice } from '@suite-common/wallet-core';

import { useDispatch, useSelector } from '../../hooks/suite';
import { getDeviceState } from '../../reducers/suite/contactsReducer';
import * as contactsActions from '../../actions/suite/contactsActions';

export const useAddContact = (onCloseModal: () => void, label: string, address: string) => {
    const dispatch = useDispatch();
    const device = useSelector(selectDevice);

    return async () => {
        const deviceState = device && getDeviceState(device);
        if (!deviceState) return { error: 'No device' };

        if (!address || !label) {
            return { error: 'Missing data' };
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
            return { error: `Signing failed: ${response.payload.error}` };
        }

        const { signature } = response.payload;

        const contact = { address, label, signature, deviceState };
        dispatch(contactsActions.addContact(contact));
        onCloseModal();

        return { error: null };
    };
};
