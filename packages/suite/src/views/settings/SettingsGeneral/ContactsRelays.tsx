import { Translation } from '@suite/intl';
import { Button, Column, Input, Row, Text } from '@trezor/components';
import { PlusIcon, TrashIcon } from '@trezor/icons';
import { SectionItem, TextColumn } from '@trezor/product-components';

import { isEnterSubmit } from 'src/utils/contacts/keyboard';
import { useContactsRelayEditor } from 'src/views/contacts/useContactsRelayEditor';

/**
 * Nostr relays of the contacts address exchange, edited as an add/remove list like the custom
 * coin backends. On desktop the request filter admits these hosts at runtime, so a relay added here
 * needs no change to the static allowlist.
 */
export const ContactsRelays = () => {
    const { relayUrls, draft, setDraft, draftErrorId, canAddRelay, addRelay, removeRelay } =
        useContactsRelayEditor();

    return (
        <SectionItem data-testid="@settings/contacts-relays">
            <Column gap={16} flex="1" alignItems="stretch">
                <TextColumn
                    title={<Translation id="TR_CONTACTS_RELAYS" />}
                    description={<Translation id="TR_CONTACTS_RELAYS_DESCRIPTION" />}
                />

                {relayUrls.length > 0 ? (
                    <Column gap={8} alignItems="stretch">
                        {relayUrls.map(url => (
                            <Row key={url} gap={12} justifyContent="space-between">
                                <Text overflowWrap="anywhere" typographyStyle="body-sm">
                                    {url}
                                </Text>
                                <Button
                                    intent="neutral"
                                    priority="secondary"
                                    size="small"
                                    iconLeft={TrashIcon}
                                    onClick={() => removeRelay(url)}
                                    data-testid="@settings/contacts-relays/remove"
                                >
                                    <Translation id="TR_REMOVE" />
                                </Button>
                            </Row>
                        ))}
                    </Column>
                ) : (
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_CONTACTS_RELAYS_EMPTY" />
                    </Text>
                )}

                <Input
                    value={draft}
                    size="small"
                    placeholder="wss://relay.example.com"
                    hasError={draftErrorId !== undefined}
                    bottomText={
                        draftErrorId !== undefined ? <Translation id={draftErrorId} /> : null
                    }
                    onChange={event => setDraft(event.target.value)}
                    onKeyDown={event => {
                        if (isEnterSubmit(event)) addRelay();
                    }}
                    rightContent={
                        <Button
                            intent="brand"
                            size="small"
                            iconLeft={PlusIcon}
                            isDisabled={!canAddRelay}
                            onClick={addRelay}
                            data-testid="@settings/contacts-relays/add"
                        >
                            <Translation id="TR_ADD" />
                        </Button>
                    }
                    data-testid="@settings/contacts-relays/input"
                />
            </Column>
        </SectionItem>
    );
};
