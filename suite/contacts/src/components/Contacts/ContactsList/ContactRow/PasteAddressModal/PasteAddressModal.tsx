import { Translation } from '@suite/intl';
import { Banner, Column, Modal, Paragraph, Textarea } from '@trezor/components';

import { usePasteContactAddress } from './usePasteContactAddress';
import { ContactsErrorMessage } from '../../../ContactsErrorMessage';

export type PasteAddressModalProps = {
    npub: string;
    name: string;
    onClose: () => void;
};

/** The payer's side: keeps an address the contact shared, once its attestation checks out. */
export const PasteAddressModal = ({ npub, name, onClose }: PasteAddressModalProps) => {
    const { text, setText, isSaving, error, save } = usePasteContactAddress({
        npub,
        onSaved: onClose,
    });

    return (
        <Modal
            heading={<Translation id="TR_CONTACTS_PASTE_ADDRESS_TITLE" values={{ name }} />}
            width={600}
            onCancel={isSaving ? undefined : onClose}
            isBackdropCancelable={!isSaving}
            bottomContent={
                <>
                    <Modal.Button
                        isLoading={isSaving}
                        isDisabled={text.trim() === ''}
                        onClick={save}
                        data-testid="@contacts/paste-address/submit"
                    >
                        <Translation id="TR_CONTACTS_PASTE_ADDRESS_SAVE" />
                    </Modal.Button>
                    <Modal.Button
                        intent="neutral"
                        priority="secondary"
                        isDisabled={isSaving}
                        onClick={onClose}
                    >
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={16} alignItems="stretch">
                <Textarea
                    label={<Translation id="TR_CONTACTS_PASTE_ADDRESS_LABEL" />}
                    value={text}
                    onChange={event => setText(event.target.value)}
                    isDisabled={isSaving}
                    hasError={error !== undefined}
                    data-testid="@contacts/paste-address/text"
                />
                <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id="TR_CONTACTS_PASTE_ADDRESS_HINT" values={{ name }} />
                </Paragraph>

                {error !== undefined && (
                    <Banner
                        intent="critical"
                        description={<ContactsErrorMessage error={error} />}
                    />
                )}
            </Column>
        </Modal>
    );
};
