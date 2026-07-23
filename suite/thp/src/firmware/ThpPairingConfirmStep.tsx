import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Card, Column, Modal, Text } from '@trezor/components';
type ThpPairingConfirmStepProps = {
    modalHeading: ReactNode;
};

// reflection of components/onboarding/ThpPairing/ThpPairingConfirmStep
export const ThpPairingConfirmStep = ({ modalHeading }: ThpPairingConfirmStepProps) => (
    <Modal.ModalBase
        onCancel={undefined} // intentionally NOT cancellable here,  cancellable on the device only
        data-testid="@firmware-modal"
        heading={modalHeading}
    >
        <Card>
            <Column alignItems="start" gap={4}>
                <Text typographyStyle="body-md-strong">
                    <Translation id="TR_THP_CONFIRM_SECURE_CONNECTION" />
                </Text>
                <Text
                    intent="neutral"
                    priority="secondary"
                    typographyStyle="body-md"
                    align="center"
                >
                    <Translation id="TR_THP_CREATE_SECURE_CONNECTION_DESCRIPTION" />
                </Text>
            </Column>
        </Card>
    </Modal.ModalBase>
);
