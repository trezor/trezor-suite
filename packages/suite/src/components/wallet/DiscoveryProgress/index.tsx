import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { useDiscovery } from '@suite-hooks';

const Wrapper = styled.div`
    width: 100%;
    height: 0;
    z-index: ${variables.Z_INDEX.DISCOVERY_PROGRESS};
    background: ${props => props.theme.BG_WHITE};
`;

const Line = styled.div<{ progress: number }>`
    height: 4px;
    display: flex;
    background: ${props => props.theme.TYPE_GREEN};
    width: ${props => props.progress}%;
    transition: 1s width;
`;

const DiscoveryProgress = () => {
    const { discovery, isDiscoveryRunning, calculateProgress } = useDiscovery();
    if (!discovery || !isDiscoveryRunning) return null;
    return (
        <Wrapper data-test="@wallet/discovery-progress-bar">
            <Line progress={calculateProgress()} />
        </Wrapper>
    );
};

export default DiscoveryProgress;
