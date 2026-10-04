import { useState } from 'react';

import { useDevice } from '@suite/device';
import { Translation, useTranslation } from '@suite/intl';
import {
    Badge,
    Banner,
    Button,
    Card,
    Column,
    Dropdown,
    type DropdownMenuItemProps,
    IconButton,
    Input,
    Modal,
    Row,
    Text,
    Tooltip,
} from '@trezor/components';
import {
    CaretLeftIcon,
    CheckIcon,
    PencilIcon,
    ShieldCheckIcon,
    TrashIcon,
    XIcon,
} from '@trezor/icons';

import {
    removeContactThunk,
    renameContactThunk,
    verifyContactThunk,
} from 'src/actions/suite/contactsThunks';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { isLocallyAnchored, selectDeviceAuthority } from 'src/reducers/suite/contactsReducer';
import {
    type ContactsError,
    getContactsErrorTranslationKey,
} from 'src/utils/contacts/contactsErrors';
import { isEnterSubmit } from 'src/utils/contacts/keyboard';
import { MAX_LABEL_BYTES, isLabelWithinLimit, labelByteLength } from 'src/utils/contacts/label';
import { npubEncode, shortenNpub } from 'src/utils/contacts/npub';
import { type WardError, getWardErrorTranslationKey } from 'src/utils/suite/wardErrors';

import { ContactAddressBuffer } from './ContactAddressBuffer';
import { ContactAvatar } from './ContactAvatar';
import { CopyIconButton } from './CopyIconButton';
import { ShareAddressControl } from './ShareAddressControl';

type ContactDetailProps = {
    /** Identity, 64-char hex. */
    npub: string;
    label: string;
    onBack: () => void;
};

/**
 * One contact, shown in place of the list: its identity, verify, rename and remove, and the
 * addresses exchanged with it. Removing the contact returns to the list.
 */
export const ContactDetail = ({ npub, label, onBack }: ContactDetailProps) => {
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const { device, isLocked } = useDevice();
    const deviceState = device?.state?.staticSessionId;
    // Verified means anchored on this device, never the stored `isVerified` hint.
    const isVerified = useSelector(
        state =>
            deviceState !== undefined &&
            isLocallyAnchored(selectDeviceAuthority(state, deviceState), npub),
    );

    const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [draft, setDraft] = useState(label);
    const [error, setError] = useState<ContactsError | null>(null);
    // A device-confirmed entry that wardd has not published yet. The contact is verified anyway.
    const [flushError, setFlushError] = useState<WardError | null>(null);

    const isDeviceLocked = isLocked();
    // A verified contact's name lives in WARD, so renaming it is confirmed on the device again; a
    // local contact is renamed without the device.
    const isRenameBlockedByLock = isDeviceLocked && isVerified;
    const isDraftTooLong = draft.trim() !== '' && !isLabelWithinLimit(draft);
    const encodedNpub = npubEncode(npub);

    const handleVerify = async () => {
        setError(null);
        setFlushError(null);
        setIsVerifying(true);

        const result = await dispatch(verifyContactThunk({ npub })).unwrap();

        setIsVerifying(false);

        if (!result.success) {
            setError(result.error);

            return;
        }

        setFlushError(result.payload.flushError ?? null);
    };

    const handleRemove = async () => {
        const result = await dispatch(removeContactThunk({ npub })).unwrap();

        setIsConfirmingRemove(false);

        if (!result.success) {
            setError(result.error);

            return;
        }

        onBack();
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setDraft(label);
    };

    const handleSave = async () => {
        if (isSaving) return;

        const nextLabel = draft.trim();

        if (nextLabel === '' || nextLabel === label) {
            cancelEdit();

            return;
        }

        // The Enter key bypasses the disabled Save button, so its conditions are checked again.
        if (!isLabelWithinLimit(nextLabel) || isRenameBlockedByLock) return;

        setError(null);
        setFlushError(null);
        setIsSaving(true);

        const result = await dispatch(renameContactThunk({ npub, label: nextLabel })).unwrap();

        setIsSaving(false);

        if (!result.success) {
            setError(result.error);

            return;
        }

        setIsEditing(false);
        setFlushError(result.payload.flushError ?? null);
    };

    const menuItems: DropdownMenuItemProps[] = [
        {
            label: <Translation id="TR_CONTACTS_RENAME" />,
            icon: PencilIcon,
            isDisabled: isRenameBlockedByLock,
            onClick: () => {
                setDraft(label);
                setIsEditing(true);
            },
        },
        {
            label: <Translation id="TR_REMOVE" />,
            icon: TrashIcon,
            onClick: () => {
                setError(null);
                setIsConfirmingRemove(true);
            },
        },
    ];

    return (
        <Column gap={24} data-testid={`@contacts/detail/${npub}`}>
            <Card>
                <Column gap={12}>
                    <Row gap={16} alignItems="center">
                        <IconButton
                            icon={CaretLeftIcon}
                            size="small"
                            intent="neutral"
                            priority="secondary"
                            onClick={onBack}
                            tooltip={{ content: <Translation id="TR_BACK" /> }}
                            aria-label={translationString('TR_BACK')}
                            data-testid="@contacts/detail/back"
                        />
                        <ContactAvatar seed={npub} label={label} size={48} />

                        {isEditing ? (
                            <Column gap={4} flex="1">
                                <Row gap={8} alignItems="center">
                                    <Input
                                        value={draft}
                                        size="small"
                                        flex="1"
                                        onChange={event => setDraft(event.target.value)}
                                        onKeyDown={event => {
                                            if (isEnterSubmit(event)) handleSave();
                                            if (event.key === 'Escape') cancelEdit();
                                        }}
                                        hasError={isDraftTooLong}
                                        // The field mounts only after an explicit rename click.
                                        // eslint-disable-next-line jsx-a11y/no-autofocus
                                        autoFocus
                                        data-testid="@contacts/detail/rename/input"
                                    />
                                    <IconButton
                                        icon={CheckIcon}
                                        size="small"
                                        intent="brand"
                                        onClick={handleSave}
                                        isLoading={isSaving}
                                        isDisabled={isRenameBlockedByLock || isDraftTooLong}
                                        tooltip={{ content: <Translation id="TR_SAVE" /> }}
                                        data-testid="@contacts/detail/rename/save"
                                    />
                                    <IconButton
                                        icon={XIcon}
                                        size="small"
                                        intent="neutral"
                                        priority="secondary"
                                        onClick={cancelEdit}
                                        tooltip={{ content: <Translation id="TR_CANCEL" /> }}
                                    />
                                </Row>
                                {isDraftTooLong && (
                                    <Text typographyStyle="body-xs" intent="critical">
                                        <Translation
                                            id="TR_CONTACTS_NAME_TOO_LONG"
                                            values={{
                                                length: labelByteLength(draft.trim()),
                                                max: MAX_LABEL_BYTES,
                                            }}
                                        />
                                    </Text>
                                )}
                            </Column>
                        ) : (
                            <>
                                <Column gap={2} flex="1">
                                    <Row gap={8} alignItems="center">
                                        <Text
                                            typographyStyle="body-md-strong"
                                            ellipsisLineCount={1}
                                        >
                                            {label}
                                        </Text>
                                        {isVerified ? (
                                            <Tooltip
                                                content={
                                                    <Translation id="TR_CONTACTS_VERIFIED_TOOLTIP" />
                                                }
                                            >
                                                <Badge
                                                    size="small"
                                                    intent="brand"
                                                    iconLeft={ShieldCheckIcon}
                                                >
                                                    <Translation id="TR_CONTACTS_VERIFIED" />
                                                </Badge>
                                            </Tooltip>
                                        ) : (
                                            <Tooltip
                                                content={
                                                    <Translation id="TR_CONTACTS_UNVERIFIED_TOOLTIP" />
                                                }
                                            >
                                                <Badge size="small" intent="neutral">
                                                    <Translation id="TR_CONTACTS_NOT_VERIFIED" />
                                                </Badge>
                                            </Tooltip>
                                        )}
                                    </Row>
                                    <Row gap={4} alignItems="center">
                                        <Text
                                            typographyStyle="body-sm"
                                            intent="neutral"
                                            priority="secondary"
                                        >
                                            {shortenNpub(encodedNpub, 14)}
                                        </Text>
                                        <CopyIconButton value={encodedNpub} />
                                    </Row>
                                </Column>

                                <Row gap={8} alignItems="center">
                                    {!isVerified && (
                                        <Tooltip
                                            content={
                                                <Translation
                                                    id={
                                                        isDeviceLocked
                                                            ? 'TR_CONTACTS_VERIFY_LOCKED'
                                                            : 'TR_CONTACTS_VERIFY_TOOLTIP'
                                                    }
                                                />
                                            }
                                        >
                                            <Button
                                                size="small"
                                                intent="brand"
                                                iconLeft={ShieldCheckIcon}
                                                onClick={handleVerify}
                                                isDisabled={isDeviceLocked}
                                                isLoading={isVerifying}
                                                data-testid={`@contacts/detail/verify/${npub}`}
                                            >
                                                <Translation id="TR_CONTACTS_VERIFY" />
                                            </Button>
                                        </Tooltip>
                                    )}
                                    <Dropdown
                                        items={menuItems}
                                        tooltip={{
                                            content: <Translation id="TR_CONTACTS_MENU_MORE" />,
                                        }}
                                        data-testid={`@contacts/detail/menu/${npub}`}
                                    />
                                </Row>
                            </>
                        )}
                    </Row>

                    {/* Verifying shows this Key on the device as 64 hex characters, not the npub. */}
                    <Column gap={4}>
                        <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                            <Translation id="TR_CONTACTS_IDENTITY_KEY" />
                        </Text>
                        <Text
                            typographyStyle="body-sm"
                            isMonospaced
                            wordBreak="break-all"
                            data-testid="@contacts/detail/key"
                        >
                            {npub}
                        </Text>
                        {!isVerified && (
                            <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                                <Translation id="TR_CONTACTS_VERIFY_KEY_HINT" />
                            </Text>
                        )}
                    </Column>

                    {error !== null && (
                        <Banner
                            intent="critical"
                            icon
                            description={
                                <Translation id={getContactsErrorTranslationKey(error.code)} />
                            }
                        />
                    )}

                    {flushError !== null && (
                        <Banner
                            intent="warning"
                            icon
                            data-testid="@contacts/detail/ward-not-published"
                            description={
                                <>
                                    <Translation id="TR_CONTACTS_WARD_NOT_PUBLISHED" />{' '}
                                    <Translation id={getWardErrorTranslationKey(flushError.code)} />
                                </>
                            }
                        />
                    )}
                </Column>
            </Card>

            <Card>
                <Column gap={12}>
                    <Row gap={8} alignItems="center" justifyContent="space-between">
                        <Text typographyStyle="body-md-strong">
                            <Translation id="TR_CONTACTS_ADDRESSES_TITLE" />
                        </Text>
                        <ShareAddressControl npub={npub} />
                    </Row>
                    <ContactAddressBuffer npub={npub} />
                </Column>
            </Card>

            {isConfirmingRemove && (
                <Modal
                    intent="warning"
                    icon={TrashIcon}
                    heading={<Translation id="TR_CONTACTS_REMOVE_CONFIRM_TITLE" />}
                    onCancel={() => setIsConfirmingRemove(false)}
                    isBackdropCancelable
                    data-testid="@contacts/detail/remove-confirm"
                    bottomContent={
                        <>
                            <Modal.Button
                                onClick={handleRemove}
                                data-testid="@contacts/detail/remove-confirm/submit"
                            >
                                <Translation id="TR_REMOVE" />
                            </Modal.Button>
                            <Modal.Button
                                intent="neutral"
                                priority="secondary"
                                onClick={() => setIsConfirmingRemove(false)}
                                data-testid="@contacts/detail/remove-confirm/cancel"
                            >
                                <Translation id="TR_CANCEL" />
                            </Modal.Button>
                        </>
                    }
                >
                    <Text as="p" typographyStyle="body-md" intent="neutral" priority="secondary">
                        <Translation
                            id={
                                isVerified
                                    ? 'TR_CONTACTS_REMOVE_CONFIRM_DESCRIPTION'
                                    : 'TR_CONTACTS_REMOVE_CONFIRM_DESCRIPTION_LOCAL'
                            }
                            values={{ label }}
                        />
                    </Text>
                </Modal>
            )}
        </Column>
    );
};
