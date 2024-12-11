import { useState } from 'react';

import { verify } from 'bitcoinjs-message';

import TrezorConnect from '@trezor/connect';
import { Banner, Button, Row } from '@trezor/components';
import { selectDevice } from '@suite-common/wallet-core';
import { TrezorDevice } from '@suite-common/suite-types';
import { spacings } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectContactsForDevice } from 'src/reducers/suite/contactsReducer';
import * as contactsActions from 'src/actions/suite/contactsActions';
import { Contact } from 'src/types/suite';

import { SettingsLayout } from '../../components/settings';
import { AddNewContactModal } from './AddNewContactModal';
import { ContactList } from './ContactList';

const FindContactButton = ({ contacts }: { contacts: Contact[] }) => {
    const findContact = () => {
        const address = prompt('Address signed by the recipient');
        const signature = prompt('Signature from the recipient');

        if (!address || !signature) {
            alert('Missing data');

            return;
        }

        const contact = contacts.find(contact => {
            try {
                return verify(address, contact.address, signature);
            } catch {
                return false;
            }
        });

        if (contact) alert(`Address "${address}" was signed by your contact "${contact.label}"`);
        else alert('Recipient not in your contacts');
    };

    return (
        <Button variant="tertiary" onClick={findContact} icon="magnifyingGlass">
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
