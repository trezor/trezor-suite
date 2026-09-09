import { getSupportedNetworks } from '@suite-common/wallet-config';
import { selectCustomBackends, selectEnabledNetworks } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';

export const useEnabledBackends = () => {
    const allNetworkSymbols = getSupportedNetworks();

    const enabledNetworks = useSelector(selectEnabledNetworks);
    const customBackends = useSelector(state => selectCustomBackends(state, allNetworkSymbols));

    return customBackends.filter(backend => enabledNetworks.includes(backend.symbol));
};
