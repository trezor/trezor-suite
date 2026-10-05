import { useDevice } from '@suite/device';
import { type TranslationKey } from '@suite/intl';
import { selectContactsRelayUrls } from '@suite/settings';

import { useSelector } from 'src/hooks/suite';
import {
    isLocallyAnchored,
    selectContactsWallet,
    selectDeviceAuthority,
} from 'src/reducers/suite/contactsReducer';
import { getEffectiveRelayUrls } from 'src/services/nostr';

/**
 * Why addresses cannot be exchanged with this contact right now, or undefined when they can. The
 * thunks refuse an unverified contact or a missing identity, and without a relay a share would cost
 * a device confirmation and reserve an address that never reaches the contact.
 */
export const useAddressExchangeBlockReason = (npub: string): TranslationKey | undefined => {
    const { device } = useDevice();
    const deviceState = device?.state?.staticSessionId;
    const hasIdentity = useSelector(
        state =>
            deviceState !== undefined &&
            selectContactsWallet(state, deviceState)?.identityNpub !== undefined,
    );
    const isVerified = useSelector(
        state =>
            deviceState !== undefined &&
            isLocallyAnchored(selectDeviceAuthority(state, deviceState), npub),
    );
    const hasRelays = useSelector(
        state => getEffectiveRelayUrls(selectContactsRelayUrls(state)).length > 0,
    );

    if (!isVerified) return 'TR_CONTACTS_EXCHANGE_NEEDS_VERIFY';

    if (!hasIdentity) return 'TR_CONTACTS_ERROR_MISSING_IDENTITY';

    if (!hasRelays) return 'TR_CONTACTS_EXCHANGE_NEEDS_RELAY';

    return undefined;
};
