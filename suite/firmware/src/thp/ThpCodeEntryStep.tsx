import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Card, Column, Modal, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { ThpPairingCodeEntry } from './ThpPairingCodeEntry';

type ThpCodeEntryStepProps = {
    modalHeading: ReactNode;
};

// reflection of components/onboarding/ThpPairing/ThpCodeEntryStep
export const ThpCodeEntryStep = ({ modalHeading }: ThpCodeEntryStepProps) => (
    <Modal.ModalBase
        onCancel={undefined} // intentionally NOT cancellable here, cancellable on the device only
        data-testid="@firmware-modal"
        heading={modalHeading}
    >
        <Card>
            <Column alignItems="start" gap={spacings.xxs}>
                <Text typographyStyle="body-md-strong">
                    <Translation id="TR_THP_ENTER_ONE_TIME_CODE" />
                </Text>
                <Column alignItems="start" gap={spacings.xl}>
                    <Text intent="neutral" priority="secondary" typographyStyle="body-md">
                        <Translation id="TR_THP_CHECK_TREZOR_FOR_CODE" />
                    </Text>
                    <ThpPairingCodeEntry />
                </Column>
            </Column>
        </Card>
    </Modal.ModalBase>
);
