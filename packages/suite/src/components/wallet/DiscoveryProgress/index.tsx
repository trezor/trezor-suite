import React from 'react';
import styled from 'styled-components';
import { useDiscovery } from '@suite-hooks';
import { isDesktop } from '@suite-utils/env';
import { DESKTOP_TITLEBAR_HEIGHT } from '@suite-constants/layout';

const TOP_OFFSET = isDesktop() ? DESKTOP_TITLEBAR_HEIGHT : '0px';

const Wrapper = styled.div`
    position: absolute;
    left: 0;
    top: ${TOP_OFFSET};
    width: 100%;
    height: 2px;
    z-index: 4;
    background: ${props => props.theme.BG_WHITE};
    overflow: hidden;
`;

const Line = styled.div<{ progress: number }>`
    height: 2px;
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
