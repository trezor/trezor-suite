import { CONTACTS, STORAGE } from 'src/actions/suite/constants';
import type { Action, Contact, TrezorDevice } from 'src/types/suite';

type ContactsRootState = {
    contacts: ContactsState;
};

type ContactsState = Contact[];

const initialState: ContactsState = [];

const isEqual = (c1: Contact, c2: Contact) =>
    c1.address === c2.address && c1.deviceState === c2.deviceState;

export const getDeviceState = (device: TrezorDevice) =>
    device.state?.staticSessionId?.split('@')?.[0];

const contactsReducer = (state: ContactsState = initialState, action: Action): ContactsState => {
    switch (action.type) {
        case STORAGE.LOAD: {
            return action.payload.contacts;
        }
        case CONTACTS.ADD: {
            const contact = action.payload;
            const index = state.findIndex(c => isEqual(c, contact));
            if (index >= 0) state[index] = contact;
            else state.push(contact);

            return state.slice();
        }
        case CONTACTS.REMOVE: {
            return state.filter(c => !isEqual(c, action.payload));
        }
        default:
            return state;
    }
};

export const selectContactsForDevice = (device: TrezorDevice) => (state: ContactsRootState) => {
    const deviceState = getDeviceState(device);

    return deviceState ? state.contacts.filter(c => c.deviceState === deviceState) : [];
};

export default contactsReducer;
