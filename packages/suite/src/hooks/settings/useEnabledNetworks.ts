import { useSelector, useActions } from 'src/hooks/suite';
import { changeCoinVisibility } from 'src/actions/settings/walletSettingsActions';
import {
    getMainnetsCompatible,
    getTestnetsCompatible,
    Network,
    NetworkCompatible,
    NetworkSymbol,
} from '@suite-common/wallet-config';

import { getMainnets, getTestnets } from '@suite-common/wallet-config';
import {
    selectHasExperimentalFeature,
    selectIsDebugModeActive,
} from 'src/reducers/suite/suiteReducer';

type EnabledNetworks = {
    mainnets: Network[];
    testnets: Network[];
    enabledNetworks: NetworkSymbol[];
    setEnabled: (symbol: NetworkSymbol, enabled: boolean) => void;
};

export const useEnabledNetworks = (): EnabledNetworks => {
    const enabledNetworks = useSelector(state => state.wallet.settings.enabledNetworks);
    const isDebug = useSelector(selectIsDebugModeActive);
    const bnbExperimentalFeature = useSelector(selectHasExperimentalFeature('bnb-smart-chain'));

    const mainnets = getMainnets(isDebug, bnbExperimentalFeature);

    const testnets = getTestnets(isDebug);

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

// TODO refactor all usages of this hook to use the new one
type EnabledNetworksCompatible = {
    mainnets: NetworkCompatible[];
    testnets: NetworkCompatible[];
    enabledNetworks: NetworkCompatible['symbol'][];
    setEnabled: (symbol: NetworkCompatible['symbol'], enabled: boolean) => void;
};

export const useEnabledNetworksCompatible = (): EnabledNetworksCompatible => {
    const enabledNetworks = useSelector(state => state.wallet.settings.enabledNetworks);
    const isDebug = useSelector(selectIsDebugModeActive);
    const bnbExperimentalFeature = useSelector(selectHasExperimentalFeature('bnb-smart-chain'));

    const mainnets = getMainnetsCompatible(isDebug, bnbExperimentalFeature);

    const testnets = getTestnetsCompatible(isDebug);

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
