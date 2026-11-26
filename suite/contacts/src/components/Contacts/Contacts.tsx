import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { selectDeviceStaticSessionId, selectIsDeviceUsingPassphrase } from '@suite-common/device';
import { selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { Banner, Column } from '@trezor/components';

import { ContactsList } from './ContactsList/ContactsList';
import { IdentityCard } from './IdentityCard/IdentityCard';

/**
 * The selected wallet's contact ID, which anyone may share, and the contacts it pays by name. Those
 * live in Suite Sync and on the Trezor's WARD, which only the standard wallet uses.
 */
export const Contacts = () => {
    const staticSessionId = useSelector(selectDeviceStaticSessionId);
    const isPassphraseWallet = useSelector(selectIsDeviceUsingPassphrase);
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);

    return (
        <Column gap={16} alignItems="stretch">
            <IdentityCard />

            {isPassphraseWallet && (
                <Banner
                    intent="info"
                    description={<Translation id="TR_CONTACTS_PASSPHRASE_WALLET" />}
                />
            )}
            {!isPassphraseWallet && !isSuiteSyncEnabled && (
                <Banner
                    intent="warning"
                    description={<Translation id="TR_CONTACTS_SUITE_SYNC_OFF" />}
                />
            )}
            {!isPassphraseWallet && isSuiteSyncEnabled && staticSessionId !== null && (
                <ContactsList staticSessionId={staticSessionId} />
            )}
        </Column>
    );
};
