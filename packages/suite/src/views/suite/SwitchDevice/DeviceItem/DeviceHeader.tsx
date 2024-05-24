import styled, { useTheme } from 'styled-components';
import { Icon } from '@trezor/components';
import { DeviceStatus } from 'src/components/suite/layouts/SuiteLayout/DeviceSelector/DeviceStatus';
import { isWebUsb } from 'src/utils/suite/transport';
import { WebUsbButton } from 'src/components/suite';
import { spacingsPx } from '@trezor/theme';
import { useSelector } from 'src/hooks/suite';
import { motion } from 'framer-motion';
import { ForegroundAppProps, TrezorDevice } from 'src/types/suite';

const Flex = styled.div`
    flex: 1;
`;
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
}

export const DeviceHeader = ({ onCancel, device, isCloseButtonVisible }: DeviceHeaderProps) => {
    const transport = useSelector(state => state.suite.transport);
    const isWebUsbTransport = isWebUsb(transport);
    const theme = useTheme();
    const deviceModelInternal = device.features?.internal_model;

    const onHeaderClick = () => {
        if (isCloseButtonVisible && onCancel) {
            onCancel();
        }
    };

    return (
        <Container onClick={onHeaderClick} $isCloseButtonVisible={isCloseButtonVisible}>
            <Flex>
                {deviceModelInternal && (
                    <DeviceStatus deviceModel={deviceModelInternal} device={device} />
                )}
            </Flex>

            <DeviceActions>
                {isWebUsbTransport && <WebUsbButton variant="tertiary" size="small" />}
                {isCloseButtonVisible && (
                    <motion.div
                        exit={{ rotate: 0 }}
                        animate={{
                            rotate: 180,
                        }}
                        style={{ originX: '50%', originY: '50%' }}
                    >
                        <Icon
                            useCursorPointer
                            size={20}
                            icon="CARET_CIRCLE_DOWN"
                            color={theme.TYPE_LIGHT_GREY}
                            hoverColor={theme.TYPE_LIGHTER_GREY}
                            onClick={() => onCancel?.()}
                        />
                    </motion.div>
                )}
            </DeviceActions>
        </Container>
    );
};
