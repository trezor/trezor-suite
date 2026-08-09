import { useRef, useState } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { Input } from '@trezor/components';
import {
    ActionButton,
    ActionColumn,
    SectionItem,
    SettingsSection,
    TextColumn,
} from '@trezor/product-components';

import { addContactThunk, removeContactThunk } from 'src/actions/suite/contactsThunks';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useDispatch, useLayout, useSelector } from 'src/hooks/suite';
import { npubEncode, parseIdentity, shortenNpub } from 'src/utils/contacts/npub';

import { ShareAddressRow, VerifyAddressRow } from './AttestationCard';
import { MyIdentityCard } from './MyIdentityCard';

const AddContact = () => {
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();
    const nameRef = useRef<HTMLInputElement>(null);
    const identityRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAdd = async () => {
        setError(null);
        setIsLoading(true);
        try {
            // accepts npub1… or raw hex, normalises to hex
            const npub = parseIdentity(identityRef.current?.value ?? '');
            await dispatch(addContactThunk({ npub, label: nameRef.current?.value ?? '' })).unwrap();
            if (nameRef.current) nameRef.current.value = '';
            if (identityRef.current) identityRef.current.value = '';
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SectionItem>
            <TextColumn
                title={<Translation id="TR_CONTACTS_ADD" />}
                description={error ?? <Translation id="TR_CONTACTS_ADD_DESCRIPTION" />}
            />
            <ActionColumn>
                <Input innerRef={nameRef} placeholder="Name" data-testid="@contacts/add/name" />
                <Input
                    innerRef={identityRef}
                    placeholder="npub1…"
                    data-testid="@contacts/add/identity"
                />
                <ActionButton
                    size="small"
                    onClick={handleAdd}
                    isDisabled={!device?.state?.staticSessionId || isLocked()}
                    isLoading={isLoading}
                    data-testid="@contacts/add/submit"
                >
                    <Translation id="TR_CONTACTS_ADD" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};

const ContactRow = ({ npub, label }: { npub: string; label: string }) => {
    const dispatch = useDispatch();
    const { isLocked } = useDevice();
    const [isLoading, setIsLoading] = useState(false);

    const handleRemove = async () => {
        setIsLoading(true);
        try {
            await dispatch(removeContactThunk({ npub })).unwrap();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SectionItem>
            <TextColumn title={label} description={shortenNpub(npubEncode(npub))} />
            <ActionColumn>
                <ActionButton
                    size="small"
                    onClick={handleRemove}
                    isDisabled={isLocked()}
                    isLoading={isLoading}
                    data-testid={`@contacts/remove/${npub}`}
                >
                    <Translation id="TR_CONTACTS_REMOVE" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};

export const Contacts = () => {
    useLayout('Contacts', <PageHeader />);
    const { device } = useDevice();

    const deviceState = device?.state?.staticSessionId;
    const contacts = useSelector(state =>
        deviceState ? state.contacts.byWallet[deviceState]?.contacts : undefined,
    );
    const entries = Object.values(contacts ?? {});

    return (
        <SettingsSection title={<Translation id="TR_CONTACTS" />}>
            <MyIdentityCard />
            <AddContact />
            <ShareAddressRow />
            <VerifyAddressRow />
            {entries.length === 0 ? (
                <SectionItem>
                    <TextColumn description={<Translation id="TR_CONTACTS_EMPTY" />} />
                </SectionItem>
            ) : (
                entries.map(contact => (
                    <ContactRow key={contact.npub} npub={contact.npub} label={contact.label} />
                ))
            )}
        </SettingsSection>
    );
};
