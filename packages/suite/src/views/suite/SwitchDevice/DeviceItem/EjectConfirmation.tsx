import styled from 'styled-components';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { H3, Button, Text } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { deviceActions } from '@suite-common/wallet-core';
import { analytics, EventType } from '@trezor/suite-analytics';
import { AcquiredDevice } from '@suite-common/suite-types';
import { MouseEventHandler, ReactNode } from 'react';
import { spacings, spacingsPx } from '@trezor/theme';
import { selectSuiteSettings } from '../../../../reducers/suite/suiteReducer';

const Container = styled.div`
    margin: 0 ${spacingsPx.xxs};
    cursor: auto;
`;

const Description = styled.div`
    margin: ${spacingsPx.xs} 0 ${spacingsPx.md} 0;
`;

const Buttons = styled.div`
    display: flex;
    gap: ${spacingsPx.xxs};
`;

type EjectConfirmationProps = {
    onCancel: MouseEventHandler<HTMLButtonElement> | undefined;
    onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    instance: AcquiredDevice;
};

type EjectConfirmationContainerProps = EjectConfirmationProps & {
    title: ReactNode;
    description: ReactNode;
    primaryButtonLabel: ReactNode;
};

const EjectConfirmationContainer = ({
    onClick,
    onCancel,
    title,
    description,
    primaryButtonLabel,
    instance,
}: EjectConfirmationContainerProps) => {
    const dispatch = useDispatch();

    const settings = useSelector(selectSuiteSettings);

    const handleEject = () => {
        dispatch(deviceActions.forgetDevice({ device: instance, settings }));

        analytics.report({
            type: EventType.SwitchDeviceEject,
        });
    };

    return (
        <Container onClick={onClick}>
            <H3>{title}</H3>
            <Description>
                <Text variant="tertiary">{description}</Text>
            </Description>
            <Buttons>
                <Button
                    size="small"
                    icon="eject"
                    iconSize={spacings.lg}
                    onClick={handleEject}
                    variant="primary"
                    isFullWidth
                    data-testid="@switch-device/eject"
                >
                    {primaryButtonLabel}
                </Button>
                <Button
                    size="small"
                    onClick={onCancel}
                    variant="tertiary"
                    isFullWidth
                    data-testid="@switch-device/cancelEject"
                >
                    <Translation id="TR_SWITCH_DEVICE_EJECT_CONFIRMATION_CANCEL_BUTTON" />
                </Button>
            </Buttons>
        </Container>
    );
};

export const EjectConfirmation = ({ onClick, onCancel, instance }: EjectConfirmationProps) => (
    <EjectConfirmationContainer
        title={<Translation id="TR_SWITCH_DEVICE_EJECT_CONFIRMATION_TITLE" />}
        description={<Translation id="TR_SWITCH_DEVICE_EJECT_CONFIRMATION_DESCRIPTION" />}
        primaryButtonLabel={<Translation id="TR_SWITCH_DEVICE_EJECT_CONFIRMATION_PRIMARY_BUTTON" />}
        onClick={onClick}
        onCancel={onCancel}
        instance={instance}
    />
);

export const EjectConfirmationDisableViewOnly = ({
    onClick,
    onCancel,
    instance,
}: EjectConfirmationProps) => (
    <EjectConfirmationContainer
        title={<Translation id="TR_SWITCH_DEVICE_EJECT_CONFIRMATION_DISABLE_VIEW_ONLY_TITLE" />}
        description={
            <Translation id="TR_SWITCH_DEVICE_EJECT_CONFIRMATION_DISABLE_VIEW_ONLY_DESCRIPTION" />
        }
        primaryButtonLabel={
            <Translation id="TR_SWITCH_DEVICE_EJECT_CONFIRMATION_DISABLE_VIEW_ONLY_PRIMARY_BUTTON" />
        }
        onClick={onClick}
        onCancel={onCancel}
        instance={instance}
    />
);
