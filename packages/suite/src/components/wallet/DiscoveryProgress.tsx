import { ProgressBar, Box } from '@trezor/components';
import { zIndices } from '@trezor/theme';

import { useDiscovery } from 'src/hooks/suite';

export const DiscoveryProgress = () => {
    const { discovery, isDiscoveryRunning, calculateProgress } = useDiscovery();

    if (!discovery || !isDiscoveryRunning) return null;

    return (
        <Box
            position={{ type: 'fixed', top: 0, left: 0, right: 0 }}
            zIndex={zIndices.discoveryProgress}
        >
            <ProgressBar value={calculateProgress()} data-testid="@wallet/discovery-progress-bar" />
        </Box>
    );
};
