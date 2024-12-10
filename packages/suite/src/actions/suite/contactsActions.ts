import { createAction } from '@reduxjs/toolkit';

import { Contact } from 'src/types/suite';

import { CONTACTS } from './constants';

export const addContact = createAction(CONTACTS.ADD, (payload: Contact) => ({ payload }));

export const removeContact = createAction(CONTACTS.REMOVE, (payload: Contact) => ({ payload }));

export type ContactsAction = ReturnType<typeof addContact> | ReturnType<typeof removeContact>;
