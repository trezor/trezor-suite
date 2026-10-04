import { type ReactNode, useState } from 'react';

import { useDevice } from '@suite/device';
import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { goto } from '@suite/router';
import { selectWarddToken } from '@suite/settings';
import {
    Badge,
    Banner,
    Button,
    Card,
    Column,
    Divider,
    Icon,
    Input,
    Row,
    Text,
} from '@trezor/components';
import { AddressBookIcon, MagnifyingGlassIcon, PlusIcon } from '@trezor/icons';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { BasicName } from 'src/components/suite/layouts/SuiteLayout/PageHeader/PageNames/BasicName';
import { useDispatch, useLayout, useSelector } from 'src/hooks/suite';
import {
    type Contact,
    contactsActions,
    isLocallyAnchored,
    selectContactsWallet,
    selectDeviceAuthority,
    selectIsContactsFeatureEnabled,
} from 'src/reducers/suite/contactsReducer';
import { groupContacts } from 'src/utils/contacts/grouping';
import { filterContacts } from 'src/utils/contacts/search';

import { AddContactModal } from './AddContactModal';
import { ContactDetail } from './ContactDetail';
import { ContactRow } from './ContactRow';
import { ContactsWelcome } from './ContactsWelcome';
import { MyIdentityCard } from './MyIdentityCard';
import { PendingRequests } from './PendingRequests';
import { RelayStatusModal } from './RelayStatusModal';
import { RelaySyncStatus } from './RelaySyncStatus';

// A long list is grouped by verification state, so the contacts that still need a device
// confirmation stand out. A short list stays flat.
const GROUP_THRESHOLD = 6;
// The search field appears only once the list is long enough to need it.
const SEARCH_THRESHOLD = 5;

const byNewest = (a: Contact, b: Contact) => b.addedAt - a.addedAt;

type SelectHandler = (npub: string) => void;

type ContactRowsProps = {
    contacts: Contact[];
    onSelect: SelectHandler;
};

const ContactRows = ({ contacts, onSelect }: ContactRowsProps) => (
    <Column gap={0}>
        {contacts.map((contact, index) => (
            <Column key={contact.npub} gap={0}>
                {index > 0 && <Divider margin={{ top: 0, bottom: 0 }} />}
                <ContactRow
                    npub={contact.npub}
                    label={contact.label}
                    onSelect={() => onSelect(contact.npub)}
                />
            </Column>
        ))}
    </Column>
);

type ContactGroupProps = ContactRowsProps & {
    titleId: 'TR_CONTACTS_GROUP_UNVERIFIED' | 'TR_CONTACTS_GROUP_VERIFIED';
};

const ContactGroup = ({ titleId, contacts, onSelect }: ContactGroupProps) => {
    if (contacts.length === 0) return null;

    return (
        <Column gap={4}>
            <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                <Translation id={titleId} />
            </Text>
            <ContactRows contacts={contacts} onSelect={onSelect} />
        </Column>
    );
};

type ContactsListProps = {
    contacts: Record<string, Contact>;
    onAdd: () => void;
    onSelect: SelectHandler;
};

const ContactsList = ({ contacts, onAdd, onSelect }: ContactsListProps) => {
    const { translationString } = useTranslation();
    const { device } = useDevice();
    const deviceState = device?.state?.staticSessionId;
    // Verified means anchored on this device, never the stored `isVerified` hint.
    const authority = useSelector(state =>
        deviceState ? selectDeviceAuthority(state, deviceState) : undefined,
    );
    const [search, setSearch] = useState('');
    const [isRelayModalOpen, setIsRelayModalOpen] = useState(false);

    const entries = Object.values(contacts).sort(byNewest);
    const filteredEntries = filterContacts(entries, search);
    // Searching or a short list reads better flat.
    const isGrouped = search.trim() === '' && entries.length > GROUP_THRESHOLD;
    const groups = groupContacts(
        filteredEntries,
        contact => authority !== undefined && isLocallyAnchored(authority, contact.npub),
    );

    return (
        <Card>
            <Column gap={12}>
                <Row gap={8} alignItems="center" justifyContent="space-between">
                    <Row gap={8} alignItems="center">
                        <Text typographyStyle="body-md-strong">
                            <Translation id="TR_CONTACTS_LIST_TITLE" />
                        </Text>
                        {entries.length > 0 && (
                            <Badge size="small" intent="neutral">
                                {entries.length}
                            </Badge>
                        )}
                    </Row>
                    <Row gap={8} alignItems="center">
                        <RelaySyncStatus onClick={() => setIsRelayModalOpen(true)} />
                        <Button
                            size="small"
                            iconLeft={PlusIcon}
                            onClick={onAdd}
                            data-testid="@contacts/add-open"
                        >
                            <Translation id="TR_CONTACTS_ADD" />
                        </Button>
                    </Row>
                </Row>

                {isRelayModalOpen && (
                    <RelayStatusModal onClose={() => setIsRelayModalOpen(false)} />
                )}

                {entries.length > SEARCH_THRESHOLD && (
                    <Input
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                        size="small"
                        leftContent={
                            <Icon
                                as={MagnifyingGlassIcon}
                                size={18}
                                intent="neutral"
                                priority="secondary"
                            />
                        }
                        showClearButton
                        onClear={() => setSearch('')}
                        placeholder={translationString('TR_CONTACTS_SEARCH_PLACEHOLDER')}
                        data-testid="@contacts/search"
                    />
                )}

                <Divider margin={{ top: 0, bottom: 0 }} />

                {entries.length === 0 && (
                    <Column alignItems="center" gap={12} margin={{ top: 24, bottom: 24 }}>
                        <Icon
                            as={AddressBookIcon}
                            size={40}
                            intent="neutral"
                            priority="secondary"
                        />
                        <Column alignItems="center" gap={2}>
                            <Text typographyStyle="body-md-strong">
                                <Translation id="TR_CONTACTS_EMPTY_TITLE" />
                            </Text>
                            <Text
                                typographyStyle="body-sm"
                                intent="neutral"
                                priority="secondary"
                                align="center"
                            >
                                <Translation id="TR_CONTACTS_EMPTY" />
                            </Text>
                        </Column>
                        <Button
                            iconLeft={PlusIcon}
                            onClick={onAdd}
                            data-testid="@contacts/empty/add"
                        >
                            <Translation id="TR_CONTACTS_ADD" />
                        </Button>
                    </Column>
                )}

                {entries.length > 0 && filteredEntries.length === 0 && (
                    <Column alignItems="center" gap={12} margin={{ top: 24, bottom: 24 }}>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation id="TR_CONTACTS_SEARCH_NO_MATCH" />
                        </Text>
                    </Column>
                )}

                {filteredEntries.length > 0 &&
                    (isGrouped ? (
                        <Column gap={16}>
                            <ContactGroup
                                titleId="TR_CONTACTS_GROUP_UNVERIFIED"
                                contacts={groups.unverified}
                                onSelect={onSelect}
                            />
                            <ContactGroup
                                titleId="TR_CONTACTS_GROUP_VERIFIED"
                                contacts={groups.verified}
                                onSelect={onSelect}
                            />
                        </Column>
                    ) : (
                        <ContactRows contacts={filteredEntries} onSelect={onSelect} />
                    ))}
            </Column>
        </Card>
    );
};

type ContactsNoticeProps = {
    titleId: TranslationKey;
    descriptionId: TranslationKey;
    action?: ReactNode;
    'data-testid': string;
};

const ContactsNotice = ({
    titleId,
    descriptionId,
    action,
    'data-testid': dataTestId,
}: ContactsNoticeProps) => (
    <Card>
        <Column gap={16}>
            <Row gap={8} alignItems="center">
                <Icon as={AddressBookIcon} size={24} intent="neutral" priority="secondary" />
                <Text typographyStyle="body-md-strong">
                    <Translation id={titleId} />
                </Text>
            </Row>

            <Banner
                icon
                intent="info"
                data-testid={dataTestId}
                description={<Translation id={descriptionId} />}
                rightContent={action}
            />
        </Column>
    </Card>
);

// Verifying a contact writes its name to WARD through wardd, which needs the pairing token. Only
// whether a token is set is read here; the token itself stays in the settings.
const WarddSetupBanner = () => {
    const dispatch = useDispatch();

    return (
        <Banner
            icon
            intent="info"
            data-testid="@contacts/wardd-setup"
            description={<Translation id="TR_CONTACTS_WARDD_SETUP" />}
            rightContent={
                <Banner.Button onClick={() => dispatch(goto({ routeName: 'settings-debug' }))}>
                    <Translation id="TR_GO_TO_SETTINGS" />
                </Banner.Button>
            }
        />
    );
};

export const Contacts = () => {
    const isContactsFeatureEnabled = useSelector(selectIsContactsFeatureEnabled);
    const isWarddConfigured = useSelector(state => selectWarddToken(state) !== undefined);
    const { device } = useDevice();
    const deviceState = device?.state?.staticSessionId;
    const wallet = useSelector(state =>
        deviceState ? selectContactsWallet(state, deviceState) : undefined,
    );
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedNpub, setSelectedNpub] = useState<string | null>(null);
    const dispatch = useDispatch();

    useLayout(
        'Contacts',
        <PageHeader>
            <BasicName>
                <Translation id="TR_CONTACTS" />
            </BasicName>
        </PageHeader>,
    );

    // The relay connections run app-wide in contactsRelayMiddleware, so the exchange continues in
    // the background and this page opens nothing itself.

    if (!isContactsFeatureEnabled) {
        return (
            <Column gap={24} data-testid="@contacts/index">
                <ContactsNotice
                    titleId="TR_CONTACTS_DISABLED_TITLE"
                    descriptionId="TR_CONTACTS_DISABLED_DESCRIPTION"
                    action={
                        <Banner.Button
                            onClick={() => dispatch(goto({ routeName: 'settings-index' }))}
                        >
                            <Translation id="TR_GO_TO_SETTINGS" />
                        </Banner.Button>
                    }
                    data-testid="@contacts/disabled"
                />
            </Column>
        );
    }

    // Contacts belong to a wallet: the identity and the WARD entries derive from seed and
    // passphrase. Without a wallet there is nothing to show.
    if (!deviceState) {
        return (
            <Column gap={24} data-testid="@contacts/index">
                <ContactsNotice
                    titleId="TR_CONTACTS_DEVICE_REQUIRED_TITLE"
                    descriptionId="TR_CONTACTS_DEVICE_REQUIRED_DESCRIPTION"
                    data-testid="@contacts/device-required"
                />
            </Column>
        );
    }

    // A fresh wallet sees the welcome once. Nothing on it adds a contact, so it closes only when
    // the user finishes it.
    if (!wallet?.isOnboarded && Object.keys(wallet?.contacts ?? {}).length === 0) {
        return (
            <Column gap={24} data-testid="@contacts/index">
                <ContactsWelcome
                    onDone={() => dispatch(contactsActions.contactsOnboarded({ deviceState }))}
                />
            </Column>
        );
    }

    // The opened contact is read live, so after a removal or a wallet switch the page falls back
    // to the list instead of showing a stale contact.
    const selectedContact = selectedNpub !== null ? wallet?.contacts[selectedNpub] : undefined;

    if (selectedContact) {
        return (
            <Column gap={24} data-testid="@contacts/index">
                {!isWarddConfigured && <WarddSetupBanner />}
                <ContactDetail
                    npub={selectedContact.npub}
                    label={selectedContact.label}
                    onBack={() => setSelectedNpub(null)}
                />
            </Column>
        );
    }

    return (
        <Column gap={24} data-testid="@contacts/index">
            {!isWarddConfigured && <WarddSetupBanner />}
            <MyIdentityCard />
            <PendingRequests />
            <ContactsList
                contacts={wallet?.contacts ?? {}}
                onAdd={() => setIsAddOpen(true)}
                onSelect={setSelectedNpub}
            />
            {isAddOpen && <AddContactModal onClose={() => setIsAddOpen(false)} />}
        </Column>
    );
};
