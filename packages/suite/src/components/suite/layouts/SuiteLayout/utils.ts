import { selectCustomBackends, selectEnabledNetworks } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';

export const useEnabledBackends = () => {
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const customBackends = useSelector(selectCustomBackends);

    return customBackends.filter(backend => enabledNetworks.includes(backend.symbol));
};
