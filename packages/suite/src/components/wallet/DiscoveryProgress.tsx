import styled from 'styled-components';

import { useDiscovery } from 'src/hooks/suite';
import { Progress } from '@trezor/components';
import { zIndices } from '@trezor/theme';

const StyledProgress = styled(Progress)`
    height: 0;
    z-index: ${zIndices.discoveryProgress};
`;

export const DiscoveryProgress = () => {
    const { discovery, isDiscoveryRunning, calculateProgress } = useDiscovery();

    if (!discovery || !isDiscoveryRunning) return null;
    return (
        <StyledProgress value={calculateProgress()} data-test="@wallet/discovery-progress-bar" />
    );
};
