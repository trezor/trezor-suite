import styled from 'styled-components';

import { useDiscovery } from 'src/hooks/suite';
import { ProgressBar } from '@trezor/components';
import { zIndices } from '@trezor/theme';

const StyledProgressBar = styled(ProgressBar)`
    height: 0;
    z-index: ${zIndices.discoveryProgress};
`;

export const DiscoveryProgress = () => {
    const { discovery, isDiscoveryRunning, calculateProgress } = useDiscovery();

    if (!discovery || !isDiscoveryRunning) return null;
    return (
        <StyledProgressBar value={calculateProgress()} data-test="@wallet/discovery-progress-bar" />
    );
};
