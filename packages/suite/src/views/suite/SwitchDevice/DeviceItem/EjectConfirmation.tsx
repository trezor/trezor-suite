import { MouseEventHandler, ReactNode } from 'react';

import styled from 'styled-components';

import { H4, Button, Paragraph, Row } from '@trezor/components';
import { deviceActions } from '@suite-common/wallet-core';
import { analytics, EventType } from '@trezor/suite-analytics';
import { AcquiredDevice } from '@suite-common/suite-types';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { selectSuiteSettings } from '../../../../reducers/suite/suiteReducer';

const Container = styled.div`
    cursor: auto;
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
            <H4>{title}</H4>
            <Paragraph variant="tertiary" typographyStyle="hint" margin={{ top: spacings.xxs }}>
                {description}
            </Paragraph>
            <Row gap={spacings.xs} margin={{ top: spacings.md }}>
                <Button
                    size="small"
                    icon="eject"
                    iconSize={spacings.lg}
                    onClick={handleEject}
                    variant="primary"
                    data-testid="@switch-device/eject"
                    isFullWidth
                >
                    {primaryButtonLabel}
                </Button>
                <Button
                    size="small"
                    onClick={onCancel}
                    variant="tertiary"
                    data-testid="@switch-device/cancelEject"
                    isFullWidth
                >
                    <Translation id="TR_SWITCH_DEVICE_EJECT_CONFIRMATION_CANCEL_BUTTON" />
                </Button>
            </Row>
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
