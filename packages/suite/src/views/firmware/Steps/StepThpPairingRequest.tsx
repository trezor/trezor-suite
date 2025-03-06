import { ReactNode } from 'react';

import { Card, Column, Modal, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from '../../../components/suite';

type StepThpPairingRequestProps = {
    modalHeading: ReactNode;
};

export const StepThpPairingRequest = ({ modalHeading }: StepThpPairingRequestProps) => (
    <Modal.ModalBase
        onCancel={undefined} // intentionally NOT cancellable here,  cancellable on the device only
        data-testid="@firmware-modal"
        heading={modalHeading}
    >
        <Card>
            <Column alignItems="start" gap={spacings.xxs}>
                <Text typographyStyle="highlight">
                    <Translation id="TR_THP_CONFIRM_SECURE_CONNECTION" />
                </Text>
                <Text variant="tertiary" typographyStyle="body" align="center">
                    <Translation id="TR_THP_CREATE_SECURE_CONNECTION_DESCRIPTION" />
                </Text>
            </Column>
        </Card>
    </Modal.ModalBase>
);
