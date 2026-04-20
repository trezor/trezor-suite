import { type ReactNode, useState } from 'react';
import { useDispatch } from 'react-redux';

import { Translation } from '@suite/intl';
import { Card, Column, Modal, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { ThpPairingFailedForFirmwareInstallation } from './ThpPairingFailedForFirmwareInstallation';
import { startThpSessionThunk } from './actions/startThpSessionThunk';

type ThpCodeInvalidStepProps = {
    modalHeading: ReactNode;
};

// reflection of components/onboarding/ThpPairing/ThpCodeInvalidStep
export const ThpCodeInvalidStep = ({ modalHeading }: ThpCodeInvalidStepProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();

    const handleRetry = () => {
        setIsLoading(true);
        // Re-try in firmware-update flow, sends only new UI response, as FW installation flow
        // keeps the TrezorConnect call pending until it's re-paired.
        dispatch(startThpSessionThunk());
    };

    return (
        <Modal.ModalBase
            onCancel={undefined} // intentionally NOT cancellable here, cancellable on the device only
            data-testid="@firmware-modal"
            heading={modalHeading}
            bottomContent={
                <Modal.Button
                    intent="neutral"
                    priority="secondary"
                    onClick={handleRetry}
                    isLoading={isLoading}
                >
                    <Translation id="TR_THP_GET_NEW_CODE" />
                </Modal.Button>
            }
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
                        <ThpPairingFailedForFirmwareInstallation />
                        <Text intent="neutral" priority="secondary">
                            <Translation id="TR_THP_INCORRECT_SECURITY_CODE" />
                        </Text>
                    </Column>
                </Column>
            </Card>
        </Modal.ModalBase>
    );
};
