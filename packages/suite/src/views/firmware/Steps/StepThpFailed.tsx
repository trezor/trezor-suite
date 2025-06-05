import { ReactNode, useState } from 'react';

import { Button, Card, Column, Modal, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { startThpSessionThunk } from '../../../actions/thp/startThpSessionThunk';
import { Translation } from '../../../components/suite';
import { ThpPairingFailedForFirmwareInstallation } from '../../../components/thp/ThpPairingFailedForFirmwareInstallation';
import { useDispatch } from '../../../hooks/suite';

type StepThpFailedProps = {
    modalHeading: ReactNode;
};

export const StepThpFailed = ({ modalHeading }: StepThpFailedProps) => {
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
                <Button variant="primary" onClick={handleRetry} isLoading={isLoading}>
                    <Translation id="TR_THP_GET_NEW_CODE" />
                </Button>
            }
        >
            <Card>
                <Column alignItems="start" gap={spacings.xxs}>
                    <Text typographyStyle="highlight">
                        <Translation id="TR_THP_ENTER_ONE_TIME_CODE" />
                    </Text>
                    <Column alignItems="start" gap={spacings.xl}>
                        <Text variant="tertiary" typographyStyle="body">
                            <Translation id="TR_THP_CHECK_TREZOR_FOR_CODE" />
                        </Text>
                        <ThpPairingFailedForFirmwareInstallation />
                        <Text variant="destructive">
                            <Translation id="TR_THP_INCORRECT_SECURITY_CODE" />
                        </Text>
                    </Column>
                </Column>
            </Card>
        </Modal.ModalBase>
    );
};
