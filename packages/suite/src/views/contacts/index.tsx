import { verify } from 'bitcoinjs-message';

import TrezorConnect from '@trezor/connect';
import { Banner, Button, Card, Dropdown, Row, Table, Text } from '@trezor/components';
import { selectDevice } from '@suite-common/wallet-core';
import { TrezorDevice } from '@suite-common/suite-types';
import { spacings } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectContactsForDevice } from 'src/reducers/suite/contactsReducer';
import * as contactsActions from 'src/actions/suite/contactsActions';
import { Contact } from 'src/types/suite';

import { SettingsLayout } from '../../components/settings';
import { useAddContactButton } from './useAddContactButton';

const ContactItem = ({
    contact: { address, label, signature },
    remove,
}: {
    contact: Contact;
    remove: () => void;
}) => {
    return (
        <Table.Row>
            <Table.Cell>
                <Text typographyStyle="highlight">{label}</Text>
            </Table.Cell>
            <Table.Cell>
                <Text variant="tertiary" typographyStyle="hint" overflowWrap="anywhere">
                    {address}
                </Text>
            </Table.Cell>
            <Table.Cell>
                <Text variant="tertiary" typographyStyle="hint" overflowWrap="anywhere">
                    {signature}
                </Text>
            </Table.Cell>
            <Table.Cell align="right">
                <Dropdown
                    alignMenu="bottom-right"
                    items={[
                        {
                            key: '1',
                            label: 'Contact',
                            options: [
                                {
                                    label: 'Delete',
                                    icon: 'userMinusFilled',
                                    onClick: remove,
                                },
                            ],
                        },
                    ]}
                />
            </Table.Cell>
        </Table.Row>
    );
};

const ContactList = ({
    contacts,
    remove,
}: {
    contacts: Contact[];
    remove: (contact: Contact) => void;
}) => {
    const onAdd = useAddContactButton();

    return (
        <Card paddingType="none" overflow="hidden">
            <Table isRowHighlightedOnHover margin={{ top: spacings.xs }}>
                <Table.Header>
                    <Table.Row>
                        <Table.Cell>Label</Table.Cell>
                        <Table.Cell>Address</Table.Cell>
                        <Table.Cell>Signature</Table.Cell>
                        <Table.Cell />
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {contacts.map((contact, i) => (
                        <ContactItem key={i} contact={contact} remove={() => remove(contact)} />
                    ))}
                </Table.Body>
                <Table.Footer>
                    <Table.Row hasBorderTop={true} isHighlightedOnHover={false}>
                        <Table.Cell colSpan={4}>
                            <Button onClick={onAdd} size="small" icon="plus">
                                Add new contact
                            </Button>
                        </Table.Cell>
                    </Table.Row>
                </Table.Footer>
            </Table>
        </Card>
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
    const onAdd = useAddContactButton();

    const removeContact = (contact: Contact) => {
        const confirmed = confirm('Do you want to remove this contact?');
        if (confirmed) {
            dispatch(contactsActions.removeContact(contact));
        }
    };

    return (
        <>
            {contacts.length ? (
                <ContactList contacts={contacts} remove={removeContact} />
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
            <div>
                <Row gap={spacings.sm}>
                    <GetMyPubkeyButton />
                    <FindContactButton contacts={contacts} />
                </Row>
            </div>
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
