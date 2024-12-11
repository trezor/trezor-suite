import styled from 'styled-components';
import { verify } from 'bitcoinjs-message';

import TrezorConnect from '@trezor/connect';
import { Banner, Button } from '@trezor/components';
import { selectDevice } from '@suite-common/wallet-core';
import { TrezorDevice } from '@suite-common/suite-types';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { getDeviceState, selectContactsForDevice } from 'src/reducers/suite/contactsReducer';
import * as contactsActions from 'src/actions/suite/contactsActions';
import { Contact } from 'src/types/suite';

import { SettingsLayout } from '../../components/settings';

const ContactsWrapper = styled.div`
    > div {
        display: flex;
        flex-direction: column;
        gap: 16px;

        > div {
            display: flex;
            flex-direction: row;

            > * {
                display: flex;
                flex: 0.25;
                overflow: hidden;

                > div {
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            }

            &:first-child {
                font-weight: bold;
            }
        }
    }

    > :last-child {
        margin-top: 16px;
        display: flex;
        flex-direction: row;
    }
`;

const ContactItem = ({
    contact: { address, label, signature },
    remove,
}: {
    contact: Contact;
    remove: () => void;
}) => {
    return (
        <div>
            <div>
                <div>{address}</div>
            </div>
            <div>
                <div>{label}</div>
            </div>
            <div>
                <div>{signature}</div>
            </div>
            <div>
                <Button size="tiny" onClick={remove}>
                    Remove
                </Button>
            </div>
        </div>
    );
};

const ContactList = ({
    contacts,
    remove,
}: {
    contacts: Contact[];
    remove: (contact: Contact) => void;
}) => {
    return (
        <div>
            <div>
                <div>Address</div>
                <div>Label</div>
                <div>Signature</div>
                <div>Remove</div>
            </div>
            {contacts.map((contact, i) => (
                <ContactItem key={i} contact={contact} remove={() => remove(contact)} />
            ))}
        </div>
    );
};

const AddContactButton = () => {
    const dispatch = useDispatch();
    const device = useSelector(selectDevice);

    const addContact = async () => {
        const deviceState = device && getDeviceState(device);
        if (!deviceState) {
            alert('No device selected or device unacquired');

            return;
        }

        const address = prompt("Recipient's address or public key");
        const label = prompt('Label for this recipient');

        if (!address || !label) {
            alert('Missing data');

            return;
        }

        const message = `${label}/${address}`;

        const response = await TrezorConnect.signMessage({
            device,
            path: "m/44'/1'/0'/0/0",
            coin: 'test',
            message,
            useEmptyPassphrase: device.useEmptyPassphrase,
        });

        if (!response.success) {
            alert(`Signing failed: ${response.payload.error}`);

            return;
        }

        const { signature } = response.payload;

        const contact = { address, label, signature, deviceState };
        dispatch(contactsActions.addContact(contact));
    };

    return (
        <Button size="small" onClick={addContact}>
            Add contact
        </Button>
    );
};

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
        <Button size="small" onClick={findContact}>
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
            prompt('Your identity pubkey', response.payload.address);
        } else {
            alert(`Failed to get pubkey: ${response.payload.error}`);
        }
    };

    return (
        <Button size="small" onClick={getMyPubkey}>
            Get my identity pubkey
        </Button>
    );
};

const Contacts = ({ device }: { device: TrezorDevice }) => {
    const contacts = useSelector(selectContactsForDevice(device));
    const dispatch = useDispatch();

    const removeContact = (contact: Contact) => {
        const confirmed = confirm('Do you want to remove this contact?');
        if (confirmed) {
            dispatch(contactsActions.removeContact(contact));
        }
    };

    return (
        <ContactsWrapper>
            {contacts.length ? (
                <ContactList contacts={contacts} remove={removeContact} />
            ) : (
                'No contacts yet'
            )}
            <div>
                <AddContactButton />
                <FindContactButton contacts={contacts} />
                <GetMyPubkeyButton />
            </div>
        </ContactsWrapper>
    );
};

export const SettingsContacts = () => {
    const device = useSelector(selectDevice);

    if (!device) {
        return <Banner>Connect your device to see contacts</Banner>;
    }

    return (
        <SettingsLayout data-testid="@settings/contacts">
            <Contacts device={device} />
        </SettingsLayout>
    );
};
