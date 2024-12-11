import { TrezorDevice } from '@suite-common/suite-types';
import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { Contact } from '../types';
import { contactsActions } from './contactsActions';

export type ContactsRootState = {
    contacts: ContactsState;
};

type ContactsState = Contact[];

const initialState: ContactsState = [];

const isEqual = (c1: Contact, c2: Contact) =>
    c1.address === c2.address && c1.deviceState === c2.deviceState;

export const getDeviceState = (device: TrezorDevice) =>
    device.state?.staticSessionId?.split('@')?.[0];

export const prepareContactsReducer = createReducerWithExtraDeps(initialState, (builder, extra) => {
    builder
        .addCase(contactsActions.addContact, (state, { payload: contact }) => {
            const index = state.findIndex(c => isEqual(c, contact));
            if (index >= 0) state[index] = contact;
            else state.push(contact);

            return state;
        })
        .addCase(contactsActions.removeContact, (state, { payload }) => {
            return state.filter(c => !isEqual(c, payload));
        })
        .addMatcher(
            action => action.type === extra.actionTypes.storageLoad,
            extra.reducers.storageLoadContacts,
        );
});
