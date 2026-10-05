import { type Contact } from 'src/reducers/suite/contactsReducer';

import { npubEncode } from './npub';

// A contact matches on what the user sees: its label and its `npub1…` encoding. The raw hex is never
// shown, and matching it gives confusing false positives (a query like "cafe" consists of hex
// characters and would hit an unrelated contact).
const isContactMatching = (contact: Contact, normalizedQuery: string): boolean =>
    contact.label.toLowerCase().includes(normalizedQuery) ||
    npubEncode(contact.npub).toLowerCase().includes(normalizedQuery);

/**
 * Filters contacts by a free-text query over label and `npub1…`. A blank query returns the same
 * array, so the caller can skip work for an empty search box.
 */
export const filterContacts = (contacts: Contact[], search: string): Contact[] => {
    const normalizedQuery = search.trim().toLowerCase();
    if (normalizedQuery === '') return contacts;

    return contacts.filter(contact => isContactMatching(contact, normalizedQuery));
};
