import { type ReactNode, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { Translation } from '@suite/intl';
import { Card, Column, Modal, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { startThpSessionThunk } from '../startThpSessionThunk';

type ThpPairingStartStepProps = {
    modalHeading: ReactNode;
    isLoading?: boolean;
};

// reflection of components/onboarding/ThpPairing/ThpPairingStartStep
export const ThpPairingStartStep = (props: ThpPairingStartStepProps) => {
    const [isLoading, setIsLoading] = useState(props.isLoading);
    const dispatch = useDispatch();
    useEffect(() => {
        setIsLoading(props.isLoading);
    }, [props.isLoading]);

    const onClick = () => {
        setIsLoading(true);
        dispatch(startThpSessionThunk());
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
