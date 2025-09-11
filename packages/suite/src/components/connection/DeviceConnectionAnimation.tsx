import styled, { keyframes } from 'styled-components';

import { Box, Column } from '@trezor/components';

import { ConnectorImage } from './ConnectorImage';
import { DEFAULT_CONNECT_DEVICE_NAME, DeviceImage } from './DeviceImage';

const slideUp = keyframes`
    0% {
        transform: translateY(100px);
        opacity: 0;
    }
    50% {
        transform: translateY(20px);
        opacity: 0.8;
    }
    100% {
        transform: translateY(0px);
        opacity: 1;
    }
`;
const CableWrapper = styled.div`
    animation: ${slideUp} 1.2s ease-out 0.3s both;
    animation-delay: 2s;
`;

type CableConnectionAnimationProps = {
    isBluetoothMode: boolean;
};

export const CableConnectionAnimation = ({
    isBluetoothMode: isBluetooth,
}: CableConnectionAnimationProps) => (
    <Column alignItems="center" position={{ type: 'relative' }}>
        <Box zIndex={2}>
            <DeviceImage size="large" deviceModel={DEFAULT_CONNECT_DEVICE_NAME} />
        </Box>
        {!isBluetooth && (
            <Box zIndex={1} margin={{ top: -20 }}>
                <CableWrapper>
                    <ConnectorImage />
                </CableWrapper>
            </Box>
        )}
    </Column>
);
