import { type MouseEventHandler } from 'react';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { deviceActions } from '@suite-common/device';
import { useDispatch } from '@suite-common/redux-utils';
import { type AcquiredDevice } from '@suite-common/suite-types';
import { Box, Button, H4, Paragraph, Row } from '@trezor/components';
import { EjectIcon } from '@trezor/icons';

type EjectConfirmationProps = {
    onCancel: MouseEventHandler<HTMLButtonElement> | undefined;
    onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    instance: AcquiredDevice;
};

export const EjectConfirmation = ({ onClick, onCancel, instance }: EjectConfirmationProps) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
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
                margin={{ top: 4 }}
            >
                <Translation id="TR_SWITCH_DEVICE_EJECT_CONFIRMATION_DESCRIPTION" />
            </Paragraph>
            <Row gap={8} margin={{ top: 16 }}>
                <Button
                    size="small"
                    iconLeft={EjectIcon}
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
