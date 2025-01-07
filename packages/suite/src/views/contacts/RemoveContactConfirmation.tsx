import React from 'react';

import { NewModal } from '@trezor/components';
import { contactsActions } from '@suite-common/contacts/src/redux/contactsActions';
import { Contact } from '@suite-common/contacts';

import { useDispatch } from '../../hooks/suite';

type RemoveContactConfirmationProps = {
    onClose: () => void;
    contact: Contact;
};

export const RemoveContactConfirmation = ({ onClose, contact }: RemoveContactConfirmationProps) => {
    const dispatch = useDispatch();

    const onRemoveContact = () => {
        dispatch(contactsActions.removeContact(contact));
        onClose();
    };

    return (
        <NewModal
            onCancel={onClose}
            iconName="warningFilled"
            variant="destructive"
            size="small"
            bottomContent={
                <>
                    <NewModal.Button variant="destructive" onClick={onRemoveContact}>
                        Remove
                    </NewModal.Button>
                    <NewModal.Button variant="tertiary" onClick={onClose}>
                        Close
                    </NewModal.Button>
                </>
            }
        >
            Are you sure you want to remove the contact?
        </NewModal>
    );
};
