import styled from 'styled-components';
import { IconButton, IconType, Row, TOOLTIP_DELAY_LONG, Tooltip } from '@trezor/components';
import { DeviceStatus } from 'src/components/suite/layouts/SuiteLayout/DeviceSelector/DeviceStatus';
import { isWebUsb } from 'src/utils/suite/transport';
import { Translation, WebUsbButton } from 'src/components/suite';
import { spacings, spacingsPx } from '@trezor/theme';
import { useSelector } from 'src/hooks/suite';
import { motion } from 'framer-motion';
import { ForegroundAppProps, TrezorDevice } from 'src/types/suite';
import { selectDevice } from '@suite-common/wallet-core';
import { WebUsbIconButton } from 'src/components/suite/WebUsbButton';

const Container = styled.div<{ $isCloseButtonVisible: boolean }>`
    display: flex;
    align-items: center;
    flex: 1;
    ${({ $isCloseButtonVisible }) => ($isCloseButtonVisible ? `cursor: pointer;` : '')}
`;

const DeviceActions = styled.div`
    display: flex;
    align-items: center;
    margin-left: ${spacingsPx.lg};
    gap: ${spacingsPx.xxs};
`;

interface DeviceHeaderProps {
    device: TrezorDevice;
    onCancel?: ForegroundAppProps['onCancel'];
    isCloseButtonVisible: boolean;
    onBackButtonClick?: () => void;
    isFindTrezorVisible?: boolean;
    forceConnectionInfo: boolean;
    icon?: IconType;
}

export const DeviceHeader = ({
    onCancel,
    device,
    isCloseButtonVisible,
    onBackButtonClick,
    isFindTrezorVisible = false,
    forceConnectionInfo,
    icon = 'CARET_CIRCLE_DOWN',
}: DeviceHeaderProps) => {
    const selectedDevice = useSelector(selectDevice);
    const transport = useSelector(state => state.suite.transport);
    const isWebUsbTransport = isWebUsb(transport);
    const isDeviceConnected = selectedDevice?.connected === true;
    const deviceModelInternal = device.features?.internal_model;

    const onHeaderClick = () => {
        if (isCloseButtonVisible && onCancel) {
            onCancel();
        }
    };

    return (
        <Container onClick={onHeaderClick} $isCloseButtonVisible={isCloseButtonVisible}>
            <Row gap={spacings.xs} flex={1}>
                {onBackButtonClick && (
                    <IconButton
                        icon="ARROW_LEFT"
                        onClick={onBackButtonClick}
                        variant="tertiary"
                        size="small"
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

            <DeviceActions>
                {isWebUsbTransport &&
                    isFindTrezorVisible &&
                    (isDeviceConnected ? (
                        <WebUsbIconButton variant="tertiary" size="small" />
                    ) : (
                        <WebUsbButton variant="primary" size="tiny" />
                    ))}
                {isCloseButtonVisible && (
                    <Tooltip delayShow={TOOLTIP_DELAY_LONG} content={<Translation id="TR_CLOSE" />}>
                        <motion.div
                            exit={{ rotate: 0 }}
                            animate={{
                                rotate: 180,
                            }}
                            style={{ originX: '50%', originY: '50%' }}
                        >
                            <IconButton
                                icon={icon}
                                iconSize={20}
                                size="small"
                                variant="tertiary"
                                onClick={() => onCancel?.()}
                            />
                        </motion.div>
                    </Tooltip>
                )}
            </DeviceActions>
        </Container>
    );
};
