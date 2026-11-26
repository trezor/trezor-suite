import { Translation } from '@suite/intl';
import { MAX_CONTACT_NAME_LENGTH } from '@suite-common/contacts';
import { Banner, Column, Input, Modal, Paragraph, Text } from '@trezor/components';

import { useAddContactForm } from './useAddContactForm';
import { ContactNameErrorMessage } from '../../ContactNameErrorMessage';
import { ContactsErrorMessage } from '../../ContactsErrorMessage';

export type AddContactModalProps = {
    onClose: () => void;
};

export const AddContactModal = ({ onClose }: AddContactModalProps) => {
    const form = useAddContactForm({ onAdded: onClose });

    const isConfirming = form.step === 'confirming';
    const isQueued = form.step === 'queued';

    return (
        <Modal
            heading={<Translation id="TR_CONTACTS_ADD" />}
            width={600}
            onCancel={isConfirming ? undefined : onClose}
            isBackdropCancelable={!isConfirming}
            bottomContent={
                isQueued ? (
                    <Modal.Button onClick={onClose}>
                        <Translation id="TR_CLOSE" />
                    </Modal.Button>
                ) : (
                    <>
                        <Modal.Button
                            isLoading={isConfirming}
                            onClick={form.submit}
                            data-testid="@contacts/add/submit"
                        >
                            <Translation id="TR_CONTACTS_ADD" />
                        </Modal.Button>
                        <Modal.Button
                            intent="neutral"
                            priority="secondary"
                            isDisabled={isConfirming}
                            onClick={onClose}
                        >
                            <Translation id="TR_CANCEL" />
                        </Modal.Button>
                    </>
                )
            }
        >
            <Column gap={16} alignItems="stretch">
                <Input
                    label={<Translation id="TR_CONTACTS_NPUB_LABEL" />}
                    value={form.npub}
                    onChange={event => form.setNpub(event.target.value)}
                    isDisabled={isConfirming || isQueued}
                    hasError={form.npubError}
                    bottomText={
                        form.npubError ? <Translation id="TR_CONTACTS_ERROR_INVALID_NPUB" /> : null
                    }
                    data-testid="@contacts/add/npub"
                />
                <Input
                    label={<Translation id="TR_CONTACTS_NAME_LABEL" />}
                    value={form.name}
                    onChange={event => form.setName(event.target.value)}
                    maxLength={MAX_CONTACT_NAME_LENGTH}
                    isDisabled={isConfirming || isQueued}
                    hasError={form.nameError !== undefined}
                    bottomText={
                        form.nameError !== undefined ? (
                            <ContactNameErrorMessage reason={form.nameError} />
                        ) : (
                            <Translation
                                id="TR_CONTACTS_NAME_HINT"
                                values={{ max: MAX_CONTACT_NAME_LENGTH }}
                            />
                        )
                    }
                    data-testid="@contacts/add/name"
                />

                {isConfirming && form.canonicalNpub !== undefined ? (
                    <Banner
                        intent="info"
                        title={<Translation id="TR_CONTACTS_ADD_CONFIRM_ON_TREZOR" />}
                        description={
                            <Text isMonospaced typographyStyle="body-sm">
                                {form.canonicalNpub}
                            </Text>
                        }
                    />
                ) : (
                    <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_CONTACTS_ADD_CONFIRM_HINT" />
                    </Paragraph>
                )}

                {isQueued && (
                    <Banner
                        intent="warning"
                        description={<Translation id="TR_CONTACTS_RESULT_QUEUED" />}
                    />
                )}

                {form.error !== undefined && (
                    <Banner
                        intent="critical"
                        description={<ContactsErrorMessage error={form.error} />}
                    />
                )}
            </Column>
        </Modal>
    );
};
