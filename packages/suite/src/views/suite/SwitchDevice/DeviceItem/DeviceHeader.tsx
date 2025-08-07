import { ReactNode } from 'react';

import { getDeviceInternalModel } from '@suite-common/suite-utils';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Box, IconButton, Row, TOOLTIP_DELAY_LONG, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation, WebUsbButton } from 'src/components/suite';
import { WebUsbIconButton } from 'src/components/suite/WebUsbButton';
import { DeviceStatus } from 'src/components/suite/layouts/SuiteLayout/DeviceSelector/DeviceStatus';
import { useSelector } from 'src/hooks/suite';
import { selectHasTransportOfType } from 'src/selectors/suite/suiteSelectors';
import { ForegroundAppProps, TrezorDevice } from 'src/types/suite';

type DeviceHeaderProps = {
    device: TrezorDevice;
    onCancel?: ForegroundAppProps['onCancel'];
    onBackButtonClick?: () => void;
    isFindTrezorVisible?: boolean;
    isDeviceStatusVisible?: boolean;
    actions?: ReactNode | null;
};

export const DeviceHeader = ({
    onCancel,
    device,
    onBackButtonClick,
    isFindTrezorVisible = false,
    isDeviceStatusVisible = true,
    actions,
}: DeviceHeaderProps) => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));
    const isDeviceConnected = selectedDevice?.connected === true;
    const deviceModelInternal = getDeviceInternalModel(device);

    const isDefaultCancelVisible = !actions && actions !== null && onCancel;

    if (
        !onBackButtonClick &&
        !actions &&
        (actions === null || !onCancel) &&
        !(isDeviceStatusVisible && device?.type === 'acquired')
    ) {
        return null;
    }

    return (
        <Row gap={spacings.sm}>
            {onBackButtonClick && (
                <IconButton
                    icon="caretLeft"
                    onClick={onBackButtonClick}
                    variant="tertiary"
                    size="small"
                    data-testid="@switch-device/back-button"
                />
            )}

            {deviceModelInternal && isDeviceStatusVisible && (
                // In case the cancel button is not visible (e.g. in device switcher),
                // we need to have an alternative, mostly for testing purposes.
                <Box
                    data-testid={
                        isDefaultCancelVisible ? undefined : '@switch-device/cancel-button'
                    }
                    onClick={isDefaultCancelVisible ? undefined : () => onCancel?.()}
                    cursor={isDefaultCancelVisible ? 'default' : 'pointer'}
                >
                    <DeviceStatus
                        deviceModel={deviceModelInternal}
                        device={device}
                        forceConnectionInfo={true}
                    />
                </Box>
            )}

            <Row gap={spacings.xxs} margin={{ left: 'auto' }}>
                {isWebUsbTransport &&
                    isFindTrezorVisible &&
                    (isDeviceConnected ? (
                        <WebUsbIconButton variant="tertiary" size="small" />
                    ) : (
                        <WebUsbButton variant="primary" size="tiny" />
                    ))}
                {isDefaultCancelVisible && (
                    <Tooltip delayShow={TOOLTIP_DELAY_LONG} content={<Translation id="TR_CLOSE" />}>
                        <IconButton
                            icon="x"
                            size="small"
                            variant="tertiary"
                            onClick={() => onCancel()}
                            data-testid="@switch-device/cancel-button"
                        />
                    </Tooltip>
                )}
                {actions}
            </Row>
        </Row>
    );
};
