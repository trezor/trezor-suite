import { Contact } from '@suite-common/contacts';
import { Button, Card, Dropdown, Table, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useDispatch } from 'src/hooks/suite';
import { handleProtocolRequest } from 'src/actions/suite/protocolActions';

const ContactItem = ({
    contact: { address, label, receiveAddresses },
    remove,
}: {
    contact: Contact;
    remove: () => void;
}) => {
    const dispatch = useDispatch();
    const prefillAddress = (ra: { address: string; signature: string }) => {
        dispatch(handleProtocolRequest('test:' + ra.address + '?signature=' + ra.signature));
    };

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
                    {receiveAddresses?.map(ra => (
                        /* eslint-disable-next-line jsx-a11y/anchor-is-valid */
                        <a href="#" onClick={() => prefillAddress(ra)} key={ra.address}>
                            {ra.address}
                        </a>
                    ))}
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

export const ContactList = ({
    contacts,
    remove,
    onAdd,
}: {
    contacts: Contact[];
    remove: (contact: Contact) => void;
    onAdd: () => void;
}) => {
    return (
        <Card paddingType="none" overflow="hidden">
            <Table isRowHighlightedOnHover margin={{ top: spacings.xs }}>
                <Table.Header>
                    <Table.Row>
                        <Table.Cell>Label</Table.Cell>
                        <Table.Cell>Npub</Table.Cell>
                        <Table.Cell>Receive address</Table.Cell>
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
