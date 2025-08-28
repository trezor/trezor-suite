import styled, { keyframes } from 'styled-components';

import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';

import { ConnectorImage } from './ConnectorImage';
import { DeviceImage } from './DeviceImage';

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
        transform: translateY(-4px);
        opacity: 1;
    }
`;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
`;

const DeviceWrapper = styled.div`
    z-index: 2;
`;

const CableWrapper = styled.div`
    animation: ${slideUp} 1.2s ease-out 0.3s both;
    z-index: 1;
    margin-top: -20px; /* Overlap slightly with device for connection effect */
`;

type CableConnectionAnimationProps = {
    isBluetoothMode: boolean;
};

export const CableConnectionAnimation = ({
    isBluetoothMode: isBluetooth,
}: CableConnectionAnimationProps) => (
    <Wrapper>
        <DeviceWrapper>
            <DeviceImage size="large" deviceModel={DEFAULT_FLAGSHIP_MODEL} />
        </DeviceWrapper>
        {!isBluetooth && (
            <CableWrapper>
                <ConnectorImage />
            </CableWrapper>
        )}
    </Wrapper>
);
