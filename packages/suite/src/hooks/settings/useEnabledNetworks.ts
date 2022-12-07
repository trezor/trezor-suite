import { useSelector, useActions } from '@suite-hooks';
import { changeCoinVisibility } from '@settings-actions/walletSettingsActions';
import type { Network } from '@wallet-types';

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
