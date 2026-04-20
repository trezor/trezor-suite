import { type ReactNode, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { selectThpConfirmationRequestId } from '@suite-common/thp';
import { Card, Column, Modal, Text } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { spacings } from '@trezor/theme';

type ThpPairingStartStepProps = {
    modalHeading: ReactNode;
    isLoading?: boolean;
};

// reflection of components/onboarding/ThpPairing/ThpPairingStartStep
export const ThpPairingStartStep = (props: ThpPairingStartStepProps) => {
    const [isLoading, setIsLoading] = useState(props.isLoading);
    const requestId = useSelector(selectThpConfirmationRequestId);
    useEffect(() => {
        setIsLoading(props.isLoading);
    }, [props.isLoading]);

    const onClick = () => {
        setIsLoading(true);
        TrezorConnect.uiResponse({
            type: 'ui-receive_confirmation',
            payload: true,
            requestId,
        });
    };

    return (
        <Modal.ModalBase
            onCancel={undefined} // intentionally NOT cancellable here,  cancellable on the device only
            data-testid="@firmware-modal"
            heading={props.modalHeading}
            bottomContent={
                <Modal.Button onClick={onClick} isLoading={isLoading}>
                    <Translation id="TR_CONTINUE" />
                </Modal.Button>
            }
        >
            <Card>
                <Column alignItems="start" gap={spacings.xxs}>
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
};
