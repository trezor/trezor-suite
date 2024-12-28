import { Network, getMainnets, getTestnets } from '@suite-common/wallet-config';
import { selectSelectedDevice, selectDeviceSupportedNetworks } from '@suite-common/wallet-core';
import { DeviceModelInternal } from '@trezor/connect';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { arrayPartition } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';
import {
    selectIsDebugModeActive,
    selectHasExperimentalFeature,
} from 'src/reducers/suite/suiteReducer';
import { EXPERIMENTAL_L2_NETWORKS } from 'src/actions/suite/constants/suiteConstants';
import { selectEnabledNetworks } from 'src/reducers/wallet/settingsReducer';

export const useNetworkSupport = () => {
    const device = useSelector(selectSelectedDevice);
    const isDebug = useSelector(selectIsDebugModeActive);
    const deviceSupportedNetworkSymbols = useSelector(selectDeviceSupportedNetworks);
    const isEthereumL2SupportEnabled = useSelector(
        selectHasExperimentalFeature('ethereum-l2-support'),
    );
    const enabledNetworks = useSelector(selectEnabledNetworks);

    const mainnets = getMainnets(isDebug).filter(network => {
        if (isEthereumL2SupportEnabled) {
            return true; // no filtering needed if L2 support is enabled
        }

        // if L2 support is not enabled
        const isExperimentalL2 = EXPERIMENTAL_L2_NETWORKS.includes(network.symbol);
        const isEnabled = enabledNetworks.includes(network.symbol);

        // filter out experimental L2 networks unless they are in the enabled networks
        return !(isExperimentalL2 && !isEnabled);
    });

    const testnets = getTestnets(isDebug);

    const isNetworkSupported = (network: Network) =>
        deviceSupportedNetworkSymbols.includes(network.symbol);

    const [supportedMainnets, unsupportedMainnets] = arrayPartition(mainnets, isNetworkSupported);
    const supportedTestnets = testnets.filter(isNetworkSupported);

    const showUnsupportedCoins =
        device?.features?.internal_model === DeviceModelInternal.T1B1 &&
        !hasBitcoinOnlyFirmware(device);

    return {
        supportedMainnets,
        unsupportedMainnets,
        supportedTestnets,
        showUnsupportedCoins,
    };
};
