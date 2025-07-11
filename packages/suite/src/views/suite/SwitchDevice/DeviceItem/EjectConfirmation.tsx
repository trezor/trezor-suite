import { MouseEventHandler } from 'react';

import { AcquiredDevice } from '@suite-common/suite-types';
import { deviceActions } from '@suite-common/wallet-core';
import { Box, Button, H4, Paragraph, Row } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { selectSuiteSettings } from '../../../../reducers/suite/suiteReducer';

type EjectConfirmationProps = {
    onCancel: MouseEventHandler<HTMLButtonElement> | undefined;
    onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    instance: AcquiredDevice;
};

export const EjectConfirmation = ({ onClick, onCancel, instance }: EjectConfirmationProps) => {
    const dispatch = useDispatch();

    const settings = useSelector(selectSuiteSettings);

    const handleEject = () => {
        dispatch(deviceActions.forgetDevice({ device: instance, settings }));

        analytics.report({
            type: EventType.SwitchDeviceEject,
        });
    };

    return (
        <Box onClick={onClick} cursor="default">
            <H4>
                <Translation id="TR_SWITCH_DEVICE_EJECT_CONFIRMATION_TITLE" />
            </H4>
            <Paragraph variant="tertiary" typographyStyle="hint" margin={{ top: spacings.xxs }}>
                <Translation id="TR_SWITCH_DEVICE_EJECT_CONFIRMATION_DESCRIPTION" />
            </Paragraph>
            <Row gap={spacings.xs} margin={{ top: spacings.md }}>
                <Button
                    size="small"
                    icon="eject"
                    onClick={handleEject}
                    variant="primary"
                    data-testid="@switch-device/eject"
                    isFullWidth
                >
                    <Translation id="TR_SWITCH_DEVICE_EJECT_CONFIRMATION_PRIMARY_BUTTON" />
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
        </Box>
    );
};
