import { Network, getMainnets, getTestnets } from '@suite-common/wallet-config';
import { selectDeviceSupportedNetworks } from '@suite-common/wallet-core';
import { arrayPartition } from '@trezor/utils';
import { useSelector } from 'src/hooks/suite';

import {
    selectHasExperimentalFeature,
    selectIsDebugModeActive,
} from 'src/reducers/suite/suiteReducer';

export const useEnabledNetworks = () => {
    const enabledNetworks = useSelector(state => state.wallet.settings.enabledNetworks);
    const isDebug = useSelector(selectIsDebugModeActive);
    const opExperimentalFeature = useSelector(selectHasExperimentalFeature('optimism'));
    const deviceSupportedNetworkSymbols = useSelector(selectDeviceSupportedNetworks);

    const mainnets = getMainnets(isDebug, opExperimentalFeature);
    const testnets = getTestnets(isDebug);

    const isNetworkSupported = (network: Network) =>
        deviceSupportedNetworkSymbols.includes(network.symbol);

    const [supportedMainnets, unsupportedMainnets] = arrayPartition(mainnets, isNetworkSupported);
    const supportedTestnets = testnets.filter(isNetworkSupported);

    return {
        supportedMainnets,
        unsupportedMainnets,
        supportedTestnets,
        enabledNetworks,
    };
};
