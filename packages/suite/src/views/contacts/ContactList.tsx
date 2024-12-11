import { Contact } from '@suite-common/contacts';
import { Button, Card, Dropdown, Table, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

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
