import React, { useState } from 'react';

import { Checkbox, Column, Input, NewModal, Textarea } from '@trezor/components';
import { selectDevice } from '@suite-common/wallet-core';
import { spacings } from '@trezor/theme';

import { useSelector } from '../../hooks/suite';
import { useAddContact } from './useAddContact';

type AddNewContactModalProps = {
    onClose: () => void;
};

export const AddNewContactModal = ({ onClose }: AddNewContactModalProps) => {
    const device = useSelector(selectDevice);
    const deviceState = device && !!device.state?.staticSessionId;

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [label, setLabel] = useState('');
    const [address, setAddress] = useState('');
    const [requestAddress, setRequestAddress] = useState(false);

    const addContact = useAddContact(onClose, label, address, requestAddress);
    const onAddContact = async () => {
        const { error } = await addContact();
        setErrorMessage(error);
    };

    if (!deviceState || errorMessage)
        return (
            <NewModal
                onCancel={onClose}
                iconName="warningFilled"
                variant="warning"
                size="small"
                bottomContent={
                    <NewModal.Button variant="tertiary" onClick={onClose}>
                        Close
                    </NewModal.Button>
                }
            >
                {errorMessage}
            </NewModal>
        );

    return (
        <NewModal
            heading="Add new contact"
            onCancel={onClose}
            size="medium"
            bottomContent={
                <>
                    <NewModal.Button onClick={onAddContact}>Save</NewModal.Button>
                    <NewModal.Button variant="tertiary" onClick={onClose}>
                        Cancel
                    </NewModal.Button>
                </>
            }
        >
            <Column gap={spacings.sm}>
                <Input
                    value={label}
                    label="Label for this recipient"
                    onChange={event => setLabel(event.target.value)}
                />
                <Textarea
                    value={address}
                    label="Recipient's address or public key"
                    onChange={event => setAddress(event.target.value)}
                />
                <Checkbox
                    isChecked={requestAddress}
                    onClick={() => setRequestAddress(!requestAddress)}
                >
                    Request address from recipient
                </Checkbox>
            </Column>
        </NewModal>
    );
};
