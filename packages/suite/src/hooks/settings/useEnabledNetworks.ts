import { Network, NetworkSymbol, getMainnets, getTestnets } from '@suite-common/wallet-config';
import { useSelector } from 'src/hooks/suite';

import {
    selectHasExperimentalFeature,
    selectIsDebugModeActive,
} from 'src/reducers/suite/suiteReducer';

type EnabledNetworks = {
    mainnets: Network[];
    testnets: Network[];
    enabledNetworks: NetworkSymbol[];
};

export const useEnabledNetworks = (): EnabledNetworks => {
    const enabledNetworks = useSelector(state => state.wallet.settings.enabledNetworks);
    const isDebug = useSelector(selectIsDebugModeActive);
    const opExperimentalFeature = useSelector(selectHasExperimentalFeature('optimism'));

    const mainnets = getMainnets(isDebug, opExperimentalFeature);

    const testnets = getTestnets(isDebug);

    return {
        mainnets,
        testnets,
        enabledNetworks,
    };
};
