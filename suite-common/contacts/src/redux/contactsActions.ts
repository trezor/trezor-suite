import { createAction } from '@reduxjs/toolkit';

import { Contact } from '../types';
import { CONTACTS_MODULE_PREFIX } from '../constants';

export const addContact = createAction(`${CONTACTS_MODULE_PREFIX}/add`, (payload: Contact) => ({
    payload,
}));

export const removeContact = createAction(
    `${CONTACTS_MODULE_PREFIX}/remove`,
    (payload: Contact) => ({ payload }),
);

export const contactsActions = {
    addContact,
    removeContact,
};
