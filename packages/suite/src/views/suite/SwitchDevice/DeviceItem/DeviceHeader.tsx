import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { getDeviceInternalModel } from '@suite-common/suite-utils';
import { IconButton, Row, TOOLTIP_DELAY_LONG, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { DeviceStatus } from 'src/components/suite/layouts/SuiteLayout/DeviceSelector/DeviceStatus';
import { type ForegroundAppProps, type TrezorDevice } from 'src/types/suite';

type DeviceHeaderProps = {
    device: TrezorDevice;
    onCancel?: ForegroundAppProps['onCancel'];
    onBackButtonClick?: () => void;
    isDeviceStatusVisible?: boolean;
    actions?: ReactNode | null;
};

export const DeviceHeader = ({
    onCancel,
    device,
    onBackButtonClick,
    isDeviceStatusVisible = true,
    actions,
}: DeviceHeaderProps) => {
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
                    intent="neutral"
                    priority="secondary"
                    data-testid="@switch-device/back-button"
                />
            )}

            {deviceModelInternal && isDeviceStatusVisible && (
                <DeviceStatus
                    deviceModel={deviceModelInternal}
                    device={device}
                    forceConnectionInfo={true}
                />
            )}

            <Row gap={spacings.xxs} margin={{ left: 'auto' }}>
                {isDefaultCancelVisible && (
                    <Tooltip delayShow={TOOLTIP_DELAY_LONG} content={<Translation id="TR_CLOSE" />}>
                        <IconButton
                            icon="x"
                            intent="neutral"
                            priority="secondary"
                            onClick={() => onCancel()}
                            data-testid="@switch-device/close-button"
                        />
                    </Tooltip>
                )}
                {actions}
            </Row>
        </Row>
    );
};
