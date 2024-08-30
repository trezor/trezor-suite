import { useSelector, useActions } from 'src/hooks/suite';
import { changeCoinVisibility } from 'src/actions/settings/walletSettingsActions';
import { NetworkCompatible } from '@suite-common/wallet-config';

import { getMainnetsCompatible, getTestnetsCompatible } from '@suite-common/wallet-config';
import {
    selectHasExperimentalFeature,
    selectIsDebugModeActive,
} from 'src/reducers/suite/suiteReducer';

type EnabledNetworks = {
    mainnets: NetworkCompatible[];
    testnets: NetworkCompatible[];
    enabledNetworks: NetworkCompatible['symbol'][];
    setEnabled: (symbol: NetworkCompatible['symbol'], enabled: boolean) => void;
};

export const useEnabledNetworks = (): EnabledNetworks => {
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
