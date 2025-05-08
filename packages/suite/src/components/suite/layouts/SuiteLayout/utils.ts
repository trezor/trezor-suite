import { selectEnabledNetworks } from '@suite-common/wallet-core';

import { useCustomBackends } from 'src/hooks/settings/backends';
import { useSelector } from 'src/hooks/suite';

export const useEnabledBackends = () => {
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const customBackends = useCustomBackends();

    return customBackends.filter(backend => enabledNetworks.includes(backend.symbol));
};
