import { useSelector } from '@suite-common/redux-utils';
import { selectCustomBackends, selectEnabledNetworks } from '@suite-common/wallet-core';
export const useEnabledBackends = () => {
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const customBackends = useSelector(selectCustomBackends);

    return customBackends.filter(backend => enabledNetworks.includes(backend.symbol));
};
