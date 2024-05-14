import { useCustomBackends } from 'src/hooks/settings/backends';
import { useSelector } from 'src/hooks/suite';

export const useEnabledBackends = () => {
    const enabledNetworks = useSelector(state => state.wallet.settings.enabledNetworks);
    const customBackends = useCustomBackends();

    return customBackends.filter(backend => enabledNetworks.includes(backend.coin));
};
