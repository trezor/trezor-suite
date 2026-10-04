import styled from 'styled-components';

import { useDevice } from '@suite/device';
import { Translation, type TranslationKey } from '@suite/intl';
import { selectContactsRelayUrls } from '@suite/settings';
import { Badge, Tooltip } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import {
    selectContactsRelayConnected,
    selectContactsWallet,
} from 'src/reducers/suite/contactsReducer';
import { getEffectiveRelayUrls } from 'src/services/nostr';

// Badge takes no onClick, so a reset button around it opens the relay modal without changing its
// look.
const TriggerButton = styled.button`
    display: inline-flex;
    align-items: center;
    padding: 0;
    margin: 0;
    border: none;
    background: none;
    cursor: pointer;
`;

type RelaySyncStatusProps = {
    onClick: () => void;
};

/**
 * State of the relay connections of the address exchange (see contactsRelayMiddleware). Addresses
 * are exchanged only while a relay is connected, which also explains a quiet address list. The
 * badge opens the relay modal.
 */
export const RelaySyncStatus = ({ onClick }: RelaySyncStatusProps) => {
    const { device } = useDevice();
    const deviceState = device?.state?.staticSessionId;
    const hasRelays = useSelector(
        state => getEffectiveRelayUrls(selectContactsRelayUrls(state)).length > 0,
    );
    const hasIdentity = useSelector(
        state =>
            deviceState !== undefined &&
            selectContactsWallet(state, deviceState)?.identityNpub !== undefined,
    );
    const isConnected = useSelector(selectContactsRelayConnected);
    const isActive = hasRelays && hasIdentity && isConnected;

    const getStatusId = (): TranslationKey => {
        if (!hasRelays) return 'TR_CONTACTS_RELAY_NONE';

        // A wallet gets its relay connections only once its identity is loaded, so until then
        // nothing is connecting for it.
        if (!hasIdentity) return 'TR_CONTACTS_RELAY_NOT_CONNECTED';

        return isConnected ? 'TR_CONTACTS_RELAY_CONNECTED' : 'TR_CONTACTS_RELAY_CONNECTING';
    };

    return (
        <Tooltip content={<Translation id="TR_CONTACTS_RELAY_MANAGE" />}>
            <TriggerButton
                type="button"
                onClick={onClick}
                data-testid="@contacts/relay-status/open"
            >
                <Badge
                    size="small"
                    intent={isActive ? 'info' : 'neutral'}
                    data-testid="@contacts/relay-status"
                >
                    <Translation id={getStatusId()} />
                </Badge>
            </TriggerButton>
        </Tooltip>
    );
};
