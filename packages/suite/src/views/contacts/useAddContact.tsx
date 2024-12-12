import TrezorConnect from '@trezor/connect';
import { selectDevice } from '@suite-common/wallet-core';
import { contactsActions, getDeviceState } from '@suite-common/contacts';

import { useDispatch, useSelector } from '../../hooks/suite';

export const useAddContact = (onCloseModal: () => void, label: string, address: string) => {
    const dispatch = useDispatch();
    const device = useSelector(selectDevice);

    return async () => {
        const deviceState = device && getDeviceState(device);
        if (!deviceState) return { error: 'No device' };

        if (!address || !label) {
            return { error: 'Missing data' };
        }

        const content = `${label}/${address}`;

        const response = await TrezorConnect.nostrSignEvent({
            device,
            useEmptyPassphrase: device.useEmptyPassphrase,
            path: "m/44'/1237'/0'/0/0",
            created_at: 0,
            kind: 27922,
            tags: [],
            content,
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
