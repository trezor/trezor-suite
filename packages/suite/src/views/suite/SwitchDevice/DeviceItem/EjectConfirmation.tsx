import styled from 'styled-components';
import { useDispatch } from 'src/hooks/suite';
import { H3, Button, Text } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { deviceActions } from '@suite-common/wallet-core';
import { analytics, EventType } from '@trezor/suite-analytics';
import { AcquiredDevice } from '@suite-common/suite-types';
import { MouseEventHandler } from 'react';
import { spacingsPx } from '@trezor/theme';

const Container = styled.div`
    margin: 0 ${spacingsPx.xxs};
    cursor: auto;
`;

const Description = styled.div`
    margin: ${spacingsPx.xs} 0;
`;

const Buttons = styled.div`
    display: flex;
    gap: ${spacingsPx.xxs};
`;

interface EjectConfirmationProps {
    instance: AcquiredDevice;
    onCancel: MouseEventHandler<HTMLButtonElement> | undefined;
    onClick: MouseEventHandler<HTMLDivElement> | undefined;
}

export const EjectConfirmation = ({ onClick, onCancel, instance }: EjectConfirmationProps) => {
    const dispatch = useDispatch();
    const handleEject = () => {
        dispatch(deviceActions.forgetDevice(instance));
        analytics.report({
            type: EventType.SwitchDeviceEject,
        });
    };

    return (
        <Container onClick={onClick}>
            <H3>
                <Translation id="TR_SWITCH_DEVICE_EJECT_CONFIRMATION_TITLE" />
            </H3>
            <Description>
                <Text variant="tertiary" typographyStyle="label">
                    <Translation id="TR_SWITCH_DEVICE_EJECT_CONFIRMATION_DESCRIPTION" />
                </Text>
            </Description>
            <Buttons>
                <Button
                    size="small"
                    icon="EJECT"
                    onClick={handleEject}
                    variant="primary"
                    isFullWidth
                >
                    <Translation id="TR_SWITCH_DEVICE_EJECT_CONFIRMATION_PRIMARY_BUTTON" />
                </Button>
                <Button size="small" onClick={onCancel} variant="tertiary" isFullWidth>
                    <Translation id="TR_SWITCH_DEVICE_EJECT_CONFIRMATION_CANCEL_BUTTON" />
                </Button>
            </Buttons>
        </Container>
    );
};
