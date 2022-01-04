import { NETWORKS } from '@wallet-config';
import { useSelector, useActions } from '@suite-hooks';
import { changeCoinVisibility } from '@settings-actions/walletSettingsActions';
import type { Network } from '@wallet-types';

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

    const mainnets: Network[] = NETWORKS.filter(n => !n.accountType && !n.testnet);

    const testnets: Network[] = NETWORKS.filter(
        n => !n.accountType && n.testnet === true && (n.symbol !== 'regtest' || debug),
    );

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
