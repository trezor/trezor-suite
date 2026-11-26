import { useState } from 'react';
import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import {
    type ContactAddressRequest,
    type ContactsRootState,
    isContactAddressRequestPending,
    selectContactAddressRequests,
    selectContactsMessaging,
} from '@suite-common/contacts';
import { selectDeviceStaticSessionId } from '@suite-common/device';
import { Button, Card, Column, H3, Paragraph, Text } from '@trezor/components';

import { AddressRequestRow } from './AddressRequestRow/AddressRequestRow';
import { useContactsInbox } from './useContactsInbox';
import { usePublishMessagingKey } from './usePublishMessagingKey';
import { ContactsErrorMessage } from '../ContactsErrorMessage';

const NO_REQUESTS: ContactAddressRequest[] = [];

/**
 * The wallet's messaging over nostr relays: whether contacts can reach it (its messaging key is
 * published), and the address requests they sent. Each request names the requester's npub; the
 * reply goes to whoever that npub is, so the user compares it before sending an address.
 */
export const MessagingCard = () => {
    const staticSessionId = useSelector(selectDeviceStaticSessionId);
    const messaging = useSelector((state: ContactsRootState) =>
        staticSessionId ? selectContactsMessaging(state, staticSessionId) : undefined,
    );
    const requests = useSelector((state: ContactsRootState) =>
        staticSessionId ? selectContactAddressRequests(state, staticSessionId) : NO_REQUESTS,
    );
    const [sentAddress, setSentAddress] = useState<string>();
    const { error } = useContactsInbox();
    const publishMessagingKey = usePublishMessagingKey();

    const pendingRequests = requests
        .filter(isContactAddressRequestPending)
        .toSorted((a, b) => b.requestedAt - a.requestedAt);

    return (
        <Card data-testid="@contacts/messaging">
            <Column gap={12} alignItems="stretch">
                <H3>
                    <Translation id="TR_CONTACTS_MESSAGING_TITLE" />
                </H3>
                <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id="TR_CONTACTS_MESSAGING_DESCRIPTION" />
                </Paragraph>

                {error !== undefined && (
                    <Text typographyStyle="body-sm" intent="critical">
                        <ContactsErrorMessage error={error} />
                    </Text>
                )}
                {error === undefined && messaging === undefined && (
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_CONTACTS_MESSAGING_CONNECTING" />
                    </Text>
                )}
                {messaging !== undefined && (
                    <Text
                        typographyStyle="body-sm"
                        intent={messaging.connectedRelayCount > 0 ? 'neutral' : 'warning'}
                        data-testid="@contacts/messaging/relays"
                    >
                        <Translation
                            id="TR_CONTACTS_MESSAGING_RELAYS"
                            values={{
                                connected: messaging.connectedRelayCount,
                                total: messaging.relayCount,
                            }}
                        />
                    </Text>
                )}

                {messaging?.isHotKeyAttested === false && (
                    <Column gap={8} alignItems="flex-start">
                        <Text typographyStyle="body-sm" intent="warning">
                            <Translation id="TR_CONTACTS_MESSAGING_KEY_MISSING" />
                        </Text>
                        <Button
                            size="small"
                            isLoading={publishMessagingKey.isPublishing}
                            onClick={publishMessagingKey.publish}
                            data-testid="@contacts/messaging/publish-key"
                        >
                            <Translation id="TR_CONTACTS_MESSAGING_KEY_PUBLISH" />
                        </Button>
                    </Column>
                )}
                {messaging?.isHotKeyAttested === true && (
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_CONTACTS_MESSAGING_KEY_PUBLISHED" />
                    </Text>
                )}
                {publishMessagingKey.error !== undefined && (
                    <Text typographyStyle="body-sm" intent="critical">
                        <ContactsErrorMessage error={publishMessagingKey.error} />
                    </Text>
                )}

                {sentAddress !== undefined && (
                    <Text typographyStyle="body-sm" intent="brand" wordBreak="break-all">
                        <Translation
                            id="TR_CONTACTS_REQUEST_SENT"
                            values={{ address: sentAddress }}
                        />
                    </Text>
                )}

                {staticSessionId !== null && messaging !== undefined && (
                    <Column gap={12} alignItems="stretch" hasDivider>
                        {pendingRequests.length === 0 ? (
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <Translation id="TR_CONTACTS_REQUESTS_EMPTY" />
                            </Text>
                        ) : (
                            pendingRequests.map(request => (
                                <AddressRequestRow
                                    key={`${request.npub}-${request.slip44}`}
                                    staticSessionId={staticSessionId}
                                    npub={request.npub}
                                    slip44={request.slip44}
                                    onSent={setSentAddress}
                                />
                            ))
                        )}
                    </Column>
                )}
            </Column>
        </Card>
    );
};
