import styled from 'styled-components';

import { getDeviceInternalModel } from '@suite-common/suite-utils';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { IconButton, Row, TOOLTIP_DELAY_LONG, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation, WebUsbButton } from 'src/components/suite';
import { WebUsbIconButton } from 'src/components/suite/WebUsbButton';
import { DeviceStatus } from 'src/components/suite/layouts/SuiteLayout/DeviceSelector/DeviceStatus';
import { useSelector } from 'src/hooks/suite';
import { selectHasTransportOfType } from 'src/reducers/suite/suiteReducer';
import { ForegroundAppProps, TrezorDevice } from 'src/types/suite';

const Container = styled.div<{ $isFullHeaderVisible: boolean }>`
    display: flex;
    align-items: center;
    flex: 1;
    ${({ $isFullHeaderVisible }) => ($isFullHeaderVisible ? `cursor: pointer;` : '')}
`;

type DeviceHeaderProps = {
    device: TrezorDevice;
    cancelDisabled?: boolean;
    onCancel?: ForegroundAppProps['onCancel'];
    isFullHeaderVisible: boolean;
    onBackButtonClick?: () => void;
    isFindTrezorVisible?: boolean;
    forceConnectionInfo: boolean;
};

export const DeviceHeader = ({
    onCancel,
    cancelDisabled,
    device,
    isFullHeaderVisible,
    onBackButtonClick,
    isFindTrezorVisible = false,
    forceConnectionInfo,
}: DeviceHeaderProps) => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));
    const isDeviceConnected = selectedDevice?.connected === true;
    const deviceModelInternal = getDeviceInternalModel(device);

    const onHeaderClick = () => {
        if (isFullHeaderVisible && onCancel && !cancelDisabled) {
            onCancel();
        }
    };

    return (
        <Container onClick={onHeaderClick} $isFullHeaderVisible={isFullHeaderVisible}>
            <Row gap={spacings.xs} flex="1">
                {onBackButtonClick && (
                    <IconButton
                        icon="caretLeft"
                        onClick={onBackButtonClick}
                        variant="tertiary"
                        size="small"
                        data-testid="@switch-device/back-button"
                    />
                )}

                {deviceModelInternal && (
                    <DeviceStatus
                        deviceModel={deviceModelInternal}
                        device={device}
                        forceConnectionInfo={forceConnectionInfo}
                    />
                )}
            </Row>

            <Row gap={spacings.xxs} margin={{ left: spacings.lg }}>
                {isFullHeaderVisible &&
                    isWebUsbTransport &&
                    isFindTrezorVisible &&
                    (isDeviceConnected ? (
                        <WebUsbIconButton variant="tertiary" size="small" />
                    ) : (
                        <WebUsbButton variant="primary" size="tiny" />
                    ))}
                {isFullHeaderVisible && !cancelDisabled && (
                    <Tooltip delayShow={TOOLTIP_DELAY_LONG} content={<Translation id="TR_CLOSE" />}>
                        <IconButton
                            icon="x"
                            size="small"
                            variant="tertiary"
                            onClick={() => onCancel?.()}
                            data-testid="@switch-device/cancel-button"
                        />
                    </Tooltip>
                )}
            </Row>
        </Container>
    );
};
