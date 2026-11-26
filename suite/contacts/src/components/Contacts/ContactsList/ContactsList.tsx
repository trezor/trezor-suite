import { useState } from 'react';
import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { type SuiteSyncDataRootState, selectSuiteSyncContacts } from '@suite-common/suite-sync';
import { Button, Card, Column, H3, Paragraph, Row } from '@trezor/components';
import { type StaticSessionId } from '@trezor/connect';
import { parseStaticSessionId } from '@trezor/device-utils';

import { AddContactModal } from './AddContactModal/AddContactModal';
import { ContactRow } from './ContactRow/ContactRow';

export type ContactsListProps = {
    staticSessionId: StaticSessionId;
};

export const ContactsList = ({ staticSessionId }: ContactsListProps) => {
    const { walletDescriptor } = parseStaticSessionId(staticSessionId);
    const contacts = useSelector((state: SuiteSyncDataRootState) =>
        selectSuiteSyncContacts(state, walletDescriptor),
    );
    const [isAddContactOpen, setIsAddContactOpen] = useState(false);

    return (
        <Card data-testid="@contacts/list">
            <Column gap={12} alignItems="stretch">
                <Row justifyContent="space-between">
                    <H3>
                        <Translation id="TR_CONTACTS" />
                    </H3>
                    <Button
                        size="small"
                        onClick={() => setIsAddContactOpen(true)}
                        data-testid="@contacts/add"
                    >
                        <Translation id="TR_CONTACTS_ADD" />
                    </Button>
                </Row>

                {contacts.length === 0 ? (
                    <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_CONTACTS_EMPTY" />
                    </Paragraph>
                ) : (
                    <Column gap={12} alignItems="stretch" hasDivider>
                        {contacts.map(contact => (
                            <ContactRow
                                key={contact.id}
                                staticSessionId={staticSessionId}
                                npub={contact.npub}
                                name={contact.name}
                            />
                        ))}
                    </Column>
                )}
            </Column>

            {isAddContactOpen && <AddContactModal onClose={() => setIsAddContactOpen(false)} />}
        </Card>
    );
};
