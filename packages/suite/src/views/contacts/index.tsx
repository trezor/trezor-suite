import { useState } from 'react';

import TrezorConnect from '@trezor/connect';
import { Banner, Button, Row } from '@trezor/components';
import { selectDevice } from '@suite-common/wallet-core';
import { TrezorDevice } from '@suite-common/suite-types';
import { spacings } from '@trezor/theme';
import {
    Contact,
    contactsActions,
    findContact,
    selectContactsForDevice,
} from '@suite-common/contacts';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { SettingsLayout } from '../../components/settings';
import { AddNewContactModal } from './AddNewContactModal';
import { ContactList } from './ContactList';

const FindContactButton = ({ contacts }: { contacts: Contact[] }) => {
    const handleClick = async () => {
        const address = prompt('Address signed by the recipient');
        const signature = prompt('Signature from the recipient');

        if (!address || !signature) {
            alert('Missing data');

            return;
        }

        const contact = await findContact(contacts, address, signature);
        if (contact) alert(`Address "${address}" was signed by your contact "${contact.label}"`);
        else alert('Recipient not in your contacts');
    };

    return (
        <Button variant="tertiary" onClick={handleClick} icon="magnifyingGlass">
            Find contact
        </Button>
    );
};

const GetMyPubkeyButton = () => {
    const device = useSelector(selectDevice);

    const getMyPubkey = async () => {
        if (!device) return;

        const response = await TrezorConnect.getAddress({
            device,
            path: "m/44'/1'/0'/0/0",
            coin: 'test',
            useEmptyPassphrase: device.useEmptyPassphrase,
            showOnTrezor: false,
            scriptType: 'SPENDADDRESS',
        });
        if (response.success) {
            alert(`Your identity pubkey: ${response.payload.address}`);
        } else {
            alert(`Failed to get pubkey: ${response.payload.error}`);
        }
    };

    return (
        <Button variant="tertiary" onClick={getMyPubkey} icon="eye">
            Show your identity
        </Button>
    );
};

const Contacts = ({ device }: { device: TrezorDevice }) => {
    const contacts = useSelector(selectContactsForDevice(device));
    const dispatch = useDispatch();
    const [isAddNewContactModalVisible, setAddNewContactModalVisible] = useState(false);

    const onAdd = () => {
        setAddNewContactModalVisible(true);
    };

    const removeContact = (contact: Contact) => {
        const confirmed = confirm('Do you want to remove this contact?');
        if (confirmed) {
            dispatch(contactsActions.removeContact(contact));
        }
    };

    return (
        <>
            {contacts.length ? (
                <ContactList contacts={contacts} remove={removeContact} onAdd={onAdd} />
            ) : (
                <Banner
                    variant="info"
                    icon
                    rightContent={
                        <Banner.Button icon="plus" onClick={onAdd}>
                            Add new contact
                        </Banner.Button>
                    }
                >
                    You have no contacts yet
                </Banner>
            )}
            <Row gap={spacings.sm}>
                <GetMyPubkeyButton />
                <FindContactButton contacts={contacts} />
            </Row>
            {isAddNewContactModalVisible && (
                <AddNewContactModal onClose={() => setAddNewContactModalVisible(false)} />
            )}
        </>
    );
};

export const SettingsContacts = () => {
    const device = useSelector(selectDevice);

    if (!device) {
        return (
            <Banner variant="warning" icon>
                Connect your device to see your contacts.
            </Banner>
        );
    }

    return (
        <SettingsLayout data-testid="@settings/contacts">
            <Contacts device={device} />
        </SettingsLayout>
    );
};
