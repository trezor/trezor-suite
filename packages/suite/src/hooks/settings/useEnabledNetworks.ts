import { useSelector, useActions } from 'src/hooks/suite';
import { changeCoinVisibility } from 'src/actions/settings/walletSettingsActions';
import type { Network } from 'src/types/wallet';

import { getMainnets, getTestnets } from '@suite-common/wallet-config';

type EnabledNetworks = {
    mainnets: Network[];
    testnets: Network[];
    enabledNetworks: Network['symbol'][];
    setEnabled: (symbol: Network['symbol'], enabled: boolean) => void;
};

export const useEnabledNetworks = (): EnabledNetworks => {
    const { enabledNetworks, debug } = useSelector(state => ({
        enabledNetworks: state.wallet.settings.enabledNetworks,
        debug: state.suite.settings.debug.showDebugMenu,
    }));

    const mainnets: Network[] = getMainnets();

    const testnets: Network[] = getTestnets(debug);

    const { setEnabled } = useActions({
        setEnabled: changeCoinVisibility,
    });

    return {
        mainnets,
        testnets,
        enabledNetworks,
        setEnabled,
    };
};
