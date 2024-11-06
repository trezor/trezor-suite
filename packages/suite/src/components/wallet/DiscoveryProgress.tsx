import styled from 'styled-components';

import { ProgressBar } from '@trezor/components';
import { zIndices } from '@trezor/theme';

import { useDiscovery } from 'src/hooks/suite';

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledProgressBar = styled(ProgressBar)`
    height: 0;
    z-index: ${zIndices.discoveryProgress};
`;

export const DiscoveryProgress = () => {
    const { discovery, isDiscoveryRunning, calculateProgress } = useDiscovery();

    if (!discovery || !isDiscoveryRunning) return null;

    return (
        <StyledProgressBar
            value={calculateProgress()}
            data-testid="@wallet/discovery-progress-bar"
        />
    );
};
