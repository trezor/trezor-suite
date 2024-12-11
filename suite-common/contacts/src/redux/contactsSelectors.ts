import { TrezorDevice } from '@suite-common/suite-types';

import { ContactsRootState, getDeviceState } from './contactsReducer';

export const selectContacts = (state: ContactsRootState) => state.contacts;

export const selectContactsForDevice = (device: TrezorDevice) => (state: ContactsRootState) => {
    const deviceState = getDeviceState(device);

    return deviceState ? state.contacts.filter(c => c.deviceState === deviceState) : [];
};
