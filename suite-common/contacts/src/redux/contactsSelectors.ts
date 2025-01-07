import { TrezorDevice } from '@suite-common/suite-types';

import { ContactsRootState } from './contactsReducer';
import { getDeviceState } from '../utils';

export const selectContacts = (state: ContactsRootState) => state.contacts;

export const selectContactsForDevice = (device: TrezorDevice) => (state: ContactsRootState) => {
    const deviceState = getDeviceState(device);

    return deviceState ? state.contacts.filter(c => c.deviceState === deviceState) : [];
};
