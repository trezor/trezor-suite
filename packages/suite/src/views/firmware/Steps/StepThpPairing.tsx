import { ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Card, Column, Modal, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { ThpPairingCodeEntry } from '../../../components/connection/thp/ThpPairingCodeEntry';

type StepThpPairingProps = {
    modalHeading: ReactNode;
};

export const StepThpPairing = ({ modalHeading }: StepThpPairingProps) => (
    <Modal.ModalBase
        onCancel={undefined} // intentionally NOT cancellable here, cancellable on the device only
        data-testid="@firmware-modal"
        heading={modalHeading}
    >
        <Card>
            <Column alignItems="start" gap={spacings.xxs}>
                <Text typographyStyle="highlight">
                    <Translation id="TR_THP_ENTER_ONE_TIME_CODE" />
                </Text>
                <Column alignItems="start" gap={spacings.xl}>
                    <Text intent="neutral" priority="secondary" typographyStyle="body">
                        <Translation id="TR_THP_CHECK_TREZOR_FOR_CODE" />
                    </Text>
                    <ThpPairingCodeEntry />
                </Column>
            </Column>
        </Card>
    </Modal.ModalBase>
);
