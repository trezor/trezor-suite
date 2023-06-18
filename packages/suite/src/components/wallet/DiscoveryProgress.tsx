import React from 'react';
import styled from 'styled-components';

import { useDiscovery } from 'src/hooks/suite';
import { Progress, variables } from '@trezor/components';

const StyledProgress = styled(Progress)`
    height: 0;
    z-index: ${variables.Z_INDEX.DISCOVERY_PROGRESS};
`;

export const DiscoveryProgress = () => {
    const { discovery, isDiscoveryRunning, calculateProgress } = useDiscovery();

    if (!discovery || !isDiscoveryRunning) return null;
    return (
        <StyledProgress value={calculateProgress()} data-test="@wallet/discovery-progress-bar" />
    );
};
