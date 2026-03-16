import { type MouseEventHandler } from 'react';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { deviceActions } from '@suite-common/device';
import { type AcquiredDevice } from '@suite-common/suite-types';
import { Box, Button, H4, Paragraph, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useDispatch } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

type EjectConfirmationProps = {
    onCancel: MouseEventHandler<HTMLButtonElement> | undefined;
    onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    instance: AcquiredDevice;
};

export const EjectConfirmation = ({ onClick, onCancel, instance }: EjectConfirmationProps) => {
    const analytics = useAnalytics();
    const dispatch = useDispatch();

    const handleEject = () => {
        dispatch(deviceActions.forgetDevice({ device: instance }));

        analytics.report({
            type: events.switchDeviceEjectEvent.name,
        });
    };

    return (
        <Box onClick={onClick} cursor="default">
            <H4>
                <Translation id="TR_SWITCH_DEVICE_EJECT_CONFIRMATION_TITLE" />
            </H4>
            <Paragraph
                intent="neutral"
                priority="secondary"
                typographyStyle="body-sm"
                margin={{ top: spacings.xxs }}
            >
                <Translation id="TR_SWITCH_DEVICE_EJECT_CONFIRMATION_DESCRIPTION" />
            </Paragraph>
            <Row gap={spacings.xs} margin={{ top: spacings.md }}>
                <Button
                    size="small"
                    iconLeft="eject"
                    onClick={handleEject}
                    intent="brand"
                    data-testid="@switch-device/eject"
                    flex="1"
                >
                    <Translation id="TR_SWITCH_DEVICE_EJECT_CONFIRMATION_PRIMARY_BUTTON" />
                </Button>
                <Button
                    size="small"
                    onClick={onCancel}
                    intent="neutral"
                    priority="secondary"
                    data-testid="@switch-device/cancelEject"
                    flex="1"
                >
                    <Translation id="TR_SWITCH_DEVICE_EJECT_CONFIRMATION_CANCEL_BUTTON" />
                </Button>
            </Row>
        </Box>
    );
};
