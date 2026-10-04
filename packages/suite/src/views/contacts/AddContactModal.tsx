import { useMemo, useState } from 'react';

import { useDevice } from '@suite/device';
import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { openDeferredModal } from '@suite/modal';
import { Banner, Button, Column, IconButton, Input, Modal, Row, Text } from '@trezor/components';
import { QrCodeIcon } from '@trezor/icons';

import { addLocalContactThunk } from 'src/actions/suite/contactsThunks';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectContactsWallet } from 'src/reducers/suite/contactsReducer';
import { type ContactIdentityStatus, evaluateContactIdentity } from 'src/utils/contacts/addContact';
import {
    type ContactsError,
    getContactsErrorTranslationKey,
} from 'src/utils/contacts/contactsErrors';
import { MAX_LABEL_BYTES, isLabelWithinLimit, labelByteLength } from 'src/utils/contacts/label';
import { normalizeScannedIdentity } from 'src/utils/contacts/npub';

const IDENTITY_HINT_IDS: Record<ContactIdentityStatus, TranslationKey> = {
    empty: 'TR_CONTACTS_ADD_NPUB_HINT',
    invalid: 'TR_CONTACTS_INVALID_IDENTITY',
    self: 'TR_CONTACTS_IDENTITY_IS_SELF',
    duplicate: 'TR_CONTACTS_IDENTITY_DUPLICATE',
    ok: 'TR_CONTACTS_ADD_NPUB_HINT',
};

type AddContactModalProps = {
    onClose: () => void;
};

/**
 * Adds a contact by name and identity. The contact is stored without the device and verified on
 * the device later. The identity can be scanned from a QR code, which suits the in-person exchange
 * the feature is built around.
 */
export const AddContactModal = ({ onClose }: AddContactModalProps) => {
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const { device } = useDevice();
    const deviceState = device?.state?.staticSessionId;
    // The own identity and the roster let the form reject a self-add or a duplicate while typing.
    const wallet = useSelector(state =>
        deviceState ? selectContactsWallet(state, deviceState) : undefined,
    );
    const ownNpub = wallet?.identityNpub;
    const roster = wallet?.contacts;

    const [name, setName] = useState('');
    const [identity, setIdentity] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<ContactsError | null>(null);

    const identityEvaluation = useMemo(
        () => evaluateContactIdentity(identity, { ownNpub, roster }),
        [identity, ownNpub, roster],
    );
    const parsedNpub = identityEvaluation.npub;

    // The name is written to WARD when the contact is verified, so a name over the cap is caught
    // here rather than at the device confirmation.
    const isNameTooLong = name.trim() !== '' && !isLabelWithinLimit(name);

    const hasIdentityError =
        identityEvaluation.status === 'invalid' ||
        identityEvaluation.status === 'self' ||
        identityEvaluation.status === 'duplicate';

    // Adding never touches the device, so a locked device is enough.
    const canSubmit =
        identityEvaluation.status === 'ok' && isLabelWithinLimit(name) && !!deviceState;

    const handleSubmit = async () => {
        if (!parsedNpub) return;

        setError(null);
        setIsSubmitting(true);

        const result = await dispatch(
            addLocalContactThunk({ npub: parsedNpub, label: name.trim() }),
        ).unwrap();

        setIsSubmitting(false);

        if (!result.success) {
            setError(result.error);

            return;
        }

        onClose();
    };

    const handleScan = async () => {
        const uri = await dispatch(openDeferredModal({ type: 'qr-reader' }));
        // Other Nostr apps put `nostr:npub1…` or hex on their QR codes. A valid scan becomes a clean
        // npub1…, anything else stays as scanned so the inline hint rejects it.
        if (typeof uri === 'string') setIdentity(normalizeScannedIdentity(uri));
    };

    return (
        <Modal heading={<Translation id="TR_CONTACTS_ADD_MODAL_TITLE" />} onCancel={onClose}>
            <Column gap={16}>
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id="TR_CONTACTS_ADD_DESCRIPTION" />
                </Text>

                <Column gap={4}>
                    <Input
                        label={<Translation id="TR_CONTACTS_NAME" />}
                        placeholder="Satoshi"
                        value={name}
                        onChange={event => setName(event.target.value)}
                        hasError={isNameTooLong}
                        size="small"
                        data-testid="@contacts/add/name"
                    />
                    {isNameTooLong && (
                        <Text typographyStyle="body-xs" intent="critical">
                            <Translation
                                id="TR_CONTACTS_NAME_TOO_LONG"
                                values={{
                                    length: labelByteLength(name.trim()),
                                    max: MAX_LABEL_BYTES,
                                }}
                            />
                        </Text>
                    )}
                </Column>

                <Column gap={4}>
                    <Row gap={8} alignItems="flex-end">
                        <Input
                            label={<Translation id="TR_CONTACTS_IDENTITY" />}
                            placeholder="npub1…"
                            value={identity}
                            onChange={event => setIdentity(event.target.value)}
                            hasError={hasIdentityError}
                            size="small"
                            flex="1"
                            data-testid="@contacts/add/identity"
                        />
                        <IconButton
                            icon={QrCodeIcon}
                            size="small"
                            intent="neutral"
                            priority="secondary"
                            onClick={handleScan}
                            tooltip={{
                                content: <Translation id="TR_SCAN_QR_CODE" />,
                            }}
                            aria-label={translationString('TR_SCAN_QR_CODE')}
                            data-testid="@contacts/add/scan"
                        />
                    </Row>
                    <Text
                        typographyStyle="body-xs"
                        intent={hasIdentityError ? 'critical' : 'neutral'}
                        priority={hasIdentityError ? 'primary' : 'secondary'}
                    >
                        <Translation id={IDENTITY_HINT_IDS[identityEvaluation.status]} />
                    </Text>
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

                <Button
                    onClick={handleSubmit}
                    isDisabled={!canSubmit}
                    isLoading={isSubmitting}
                    width="100%"
                    data-testid="@contacts/add/submit"
                >
                    <Translation id="TR_CONTACTS_ADD" />
                </Button>
            </Column>
        </Modal>
    );
};
