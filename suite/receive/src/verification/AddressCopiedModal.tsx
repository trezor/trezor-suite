import { Translation, type TranslationKey } from '@suite/intl';
import { Card, Column, Modal, Row, Text } from '@trezor/components';

const STEPS: TranslationKey[] = [
    'RECEIVE_ADDRESS_COPIED_STEP_PASTE',
    'RECEIVE_ADDRESS_COPIED_STEP_VERIFY',
];

type AddressCopiedModalProps = {
    addressPath: string | undefined;
    isVerifying: boolean;
    onVerify: (path: string) => Promise<void>;
    onDismiss: () => void;
};

export const AddressCopiedModal = ({
    addressPath,
    isVerifying,
    onVerify,
    onDismiss,
}: AddressCopiedModalProps) => {
    if (addressPath === undefined) {
        return null;
    }

    const handleVerify = async () => {
        await onVerify(addressPath);
        onDismiss();
    };

    return (
        <Modal
            heading={<Translation id="RECEIVE_ADDRESS_COPIED_TITLE" />}
            width={600}
            data-testid="@wallet/receive/address-copied-modal"
            onCancel={isVerifying ? undefined : onDismiss}
            bottomContent={
                <>
                    <Modal.Button
                        isLoading={isVerifying}
                        data-testid="@wallet/receive/address-copied-modal/verify-button"
                        onClick={handleVerify}
                    >
                        <Translation id="RECEIVE_VERIFY_ON_TREZOR" />
                    </Modal.Button>
                    <Modal.Button
                        onClick={onDismiss}
                        intent="neutral"
                        priority="secondary"
                        isDisabled={isVerifying}
                        data-testid="@wallet/receive/address-copied-modal/skip-button"
                    >
                        <Translation id="RECEIVE_SKIP_VERIFICATION" />
                    </Modal.Button>
                </>
            }
        >
            <Card>
                <Column gap={12} alignItems="flex-start">
                    {STEPS.map((step, i) => (
                        <Row key={step} gap={12} alignItems="flex-start">
                            <Text typographyStyle="body-md">{i + 1}.</Text>
                            <Text typographyStyle="body-md">
                                <Translation id={step} />
                            </Text>
                        </Row>
                    ))}
                </Column>
            </Card>
        </Modal>
    );
};
