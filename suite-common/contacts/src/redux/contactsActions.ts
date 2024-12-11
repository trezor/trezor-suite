import { createAction } from '@reduxjs/toolkit';

import { Contact } from '../types';
import * as CONTACTS from '../constants';

export const addContact = createAction(CONTACTS.ADD, (payload: Contact) => ({ payload }));

export const removeContact = createAction(CONTACTS.REMOVE, (payload: Contact) => ({ payload }));

export const contactsActions = {
    addContact,
    removeContact,
};

export type ContactsAction = ReturnType<typeof addContact> | ReturnType<typeof removeContact>;
