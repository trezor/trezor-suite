import styled from 'styled-components';

import { useDiscovery } from 'src/hooks/suite';
import { ProgressBar, variables } from '@trezor/components';

const StyledProgressBar = styled(ProgressBar)`
    height: 0;
    z-index: ${variables.Z_INDEX.DISCOVERY_PROGRESS};
`;

export const DiscoveryProgress = () => {
    const { discovery, isDiscoveryRunning, calculateProgress } = useDiscovery();

    if (!discovery || !isDiscoveryRunning) return null;
    return (
        <StyledProgressBar value={calculateProgress()} data-test="@wallet/discovery-progress-bar" />
    );
};
