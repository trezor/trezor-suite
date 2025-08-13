import { AcquiredDevice } from '@suite-common/suite-types';
import { deviceActions } from '@suite-common/wallet-core';
import { Button, Card, Column, H3, Paragraph, Row } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

type EjectAllConfirmationProps = {
    onCancel: () => void;
    instances: AcquiredDevice[];
};

export const EjectAllConfirmation = ({ onCancel, instances }: EjectAllConfirmationProps) => {
    const dispatch = useDispatch();

    const handleEjectAll = () => {
        instances.forEach(instance => {
            dispatch(deviceActions.forgetDevice({ device: instance }));
        });

        analytics.report({
            type: EventType.SwitchDeviceEject,
        });

        onCancel();
    };

    return (
        <Card paddingType="none">
            <Column padding={spacings.sm} gap={spacings.xs}>
                <H3>
                    <Translation id="TR_SWITCH_DEVICE_EJECT_ALL_CONFIRMATION_TITLE" />
                </H3>
                <Paragraph variant="tertiary" typographyStyle="hint">
                    <Translation id="TR_SWITCH_DEVICE_EJECT_ALL_CONFIRMATION_DESCRIPTION" />
                </Paragraph>
                <Row gap={spacings.xs} margin={{ top: spacings.md }}>
                    <Button
                        size="small"
                        icon="eject"
                        onClick={handleEjectAll}
                        variant="primary"
                        data-testid="@switch-device/ejectAll"
                        isFullWidth
                    >
                        <Translation id="TR_SWITCH_DEVICE_EJECT_CONFIRMATION_PRIMARY_BUTTON" />
                    </Button>
                    <Button
                        size="small"
                        onClick={onCancel}
                        variant="tertiary"
                        data-testid="@switch-device/cancelEjectAll"
                        isFullWidth
                    >
                        <Translation id="TR_SWITCH_DEVICE_EJECT_CONFIRMATION_CANCEL_BUTTON" />
                    </Button>
                </Row>
            </Column>
        </Card>
    );
};
