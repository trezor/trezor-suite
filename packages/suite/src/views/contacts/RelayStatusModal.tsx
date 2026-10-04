import { Translation, useTranslation } from '@suite/intl';
import {
    Button,
    Column,
    Icon,
    IconButton,
    Input,
    Modal,
    Row,
    Text,
    Tooltip,
} from '@trezor/components';
import { DotFilledIcon, PlusIcon, TrashIcon } from '@trezor/icons';

import { useSelector } from 'src/hooks/suite';
import { selectRelayUrlStatuses } from 'src/reducers/suite/contactsReducer';
import { isEnterSubmit } from 'src/utils/contacts/keyboard';

import { useContactsRelayEditor } from './useContactsRelayEditor';

type RelayStatusModalProps = {
    onClose: () => void;
};

/**
 * The relays in use with a live connection dot each, opened from the relay badge on the contacts
 * page. Relays can be added and removed here as in the settings editor.
 */
export const RelayStatusModal = ({ onClose }: RelayStatusModalProps) => {
    const { translationString } = useTranslation();
    const urlStatus = useSelector(selectRelayUrlStatuses);
    const { relayUrls, draft, setDraft, draftErrorId, canAddRelay, addRelay, removeRelay } =
        useContactsRelayEditor();

    return (
        <Modal
            heading={<Translation id="TR_CONTACTS_RELAYS" />}
            description={<Translation id="TR_CONTACTS_RELAYS_DESCRIPTION" />}
            onCancel={onClose}
            data-testid="@contacts/relay-modal"
        >
            <Column gap={16}>
                {relayUrls.length > 0 ? (
                    <Column gap={8}>
                        {relayUrls.map(url => {
                            const isConnected = urlStatus[url] === true;

                            return (
                                <Row
                                    key={url}
                                    gap={12}
                                    alignItems="center"
                                    justifyContent="space-between"
                                >
                                    <Row gap={8} alignItems="center">
                                        <Tooltip
                                            content={
                                                <Translation
                                                    id={
                                                        isConnected
                                                            ? 'TR_CONTACTS_RELAY_CONNECTED'
                                                            : 'TR_CONTACTS_RELAY_CONNECTING'
                                                    }
                                                />
                                            }
                                        >
                                            <Icon
                                                as={DotFilledIcon}
                                                size={12}
                                                intent={isConnected ? 'info' : 'neutral'}
                                                priority={isConnected ? 'primary' : 'secondary'}
                                            />
                                        </Tooltip>
                                        <Text overflowWrap="anywhere" typographyStyle="body-sm">
                                            {url}
                                        </Text>
                                    </Row>
                                    <IconButton
                                        icon={TrashIcon}
                                        size="small"
                                        intent="neutral"
                                        priority="secondary"
                                        onClick={() => removeRelay(url)}
                                        tooltip={{ content: <Translation id="TR_REMOVE" /> }}
                                        aria-label={translationString('TR_REMOVE')}
                                        data-testid="@contacts/relay-modal/remove"
                                    />
                                </Row>
                            );
                        })}
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
                            data-testid="@contacts/relay-modal/add"
                        >
                            <Translation id="TR_ADD" />
                        </Button>
                    }
                    data-testid="@contacts/relay-modal/input"
                />
            </Column>
        </Modal>
    );
};
