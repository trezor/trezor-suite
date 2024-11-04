import { useCustomBackends } from 'src/hooks/settings/backends';
import { useSelector } from 'src/hooks/suite';
import { selectEnabledNetworks } from 'src/reducers/wallet/settingsReducer';

export const useEnabledBackends = () => {
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const customBackends = useCustomBackends();

    return customBackends.filter(backend => enabledNetworks.includes(backend.coin));
};
