import { Network, NetworkSymbol, getMainnets, getTestnets } from '@suite-common/wallet-config';
import { changeCoinVisibility } from 'src/actions/settings/walletSettingsActions';
import { useActions, useSelector } from 'src/hooks/suite';

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
