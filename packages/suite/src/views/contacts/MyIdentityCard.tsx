import { useState } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { ContactsFirmwareError, loadIdentityThunk } from 'src/actions/suite/contactsThunks';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { npubEncode } from 'src/utils/contacts/npub';

export const MyIdentityCard = () => {
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();
    const deviceState = device?.state?.staticSessionId;
    const identityNpub = useSelector(state =>
        deviceState ? state.contacts.byWallet[deviceState]?.identityNpub : undefined,
    );

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<'firmware' | 'generic' | null>(null);

    const handleLoad = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await dispatch(loadIdentityThunk()).unwrap();
        } catch (e) {
            setError(e instanceof ContactsFirmwareError ? 'firmware' : 'generic');
        } finally {
            setIsLoading(false);
        }
    };

    const description = () => {
        if (error === 'firmware') {
            return <Translation id="TR_CONTACTS_IDENTITY_REQUIRES_DEBUG_FIRMWARE" />;
        }
        if (identityNpub) return npubEncode(identityNpub);

        return <Translation id="TR_CONTACTS_MY_IDENTITY_DESCRIPTION" />;
    };

    return (
        <SectionItem>
            <TextColumn
                title={<Translation id="TR_CONTACTS_MY_IDENTITY" />}
                description={description()}
                data-testid="@contacts/my-identity"
            />
            {!identityNpub && (
                <ActionColumn>
                    <ActionButton
                        onClick={handleLoad}
                        size="small"
                        isDisabled={!deviceState || isLocked()}
                        isLoading={isLoading}
                        data-testid="@contacts/load-identity"
                    >
                        <Translation id="TR_CONTACTS_LOAD_IDENTITY" />
                    </ActionButton>
                </ActionColumn>
            )}
        </SectionItem>
    );
};
