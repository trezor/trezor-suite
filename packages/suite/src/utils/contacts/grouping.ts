import { type Contact } from 'src/reducers/suite/contactsReducer';

export type ContactGroups = {
    /** Contacts whose key is not yet confirmed on this device. */
    unverified: Contact[];
    /** Contacts whose key is confirmed on this device. */
    verified: Contact[];
};

/**
 * Splits contacts into the two trust groups in one pass, keeping the input order within each group.
 * `isAnchored` closes over the local device authority, so "verified" means confirmed on this device.
 */
export const groupContacts = (
    contacts: Contact[],
    isAnchored: (contact: Contact) => boolean,
): ContactGroups => {
    const groups: ContactGroups = { unverified: [], verified: [] };

    contacts.forEach(contact => {
        if (isAnchored(contact)) {
            groups.verified.push(contact);
        } else {
            groups.unverified.push(contact);
        }
    });

    return groups;
};
