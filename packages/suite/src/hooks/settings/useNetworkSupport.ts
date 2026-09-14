import { selectIsDebugModeActive } from '@suite/debug';
import { selectHasExperimentalFeature, selectIsTestnetNetworksEnabled } from '@suite/settings';
import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { selectNetworkConfigDeps } from '@suite-common/networks';
import { type Network, getMainnets, getTestnets } from '@suite-common/wallet-config';
import { selectDeviceSupportedNetworks } from '@suite-common/wallet-core';
import { DeviceModelInternal, hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { arrayPartition } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

export const useNetworkSupport = () => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const device = useSelector(selectSelectedDevice);
    const isDebug = useSelector(selectIsDebugModeActive);
    const useExperimentalNetworks = useSelector(
        selectHasExperimentalFeature('experimental-networks'),
    );
    const useTestnetNetworks = useSelector(selectIsTestnetNetworksEnabled);
    const deviceSupportedNetworkSymbols = useSelector(selectDeviceSupportedNetworks);

    const mainnets = getMainnets(networkConfigDeps, {
        debug: isDebug,
        useExperimentalNetworks,
    });
    const testnets = getTestnets(networkConfigDeps, {
        debug: isDebug,
        useExperimentalNetworks,
        useTestnetNetworks,
    });

    const isNetworkSupported = (network: Network) =>
        deviceSupportedNetworkSymbols.includes(network.symbol);

    const [supportedMainnets, unsupportedMainnets] = arrayPartition(mainnets, isNetworkSupported);
    const [supportedTestnets, unsupportedTestnets] = arrayPartition(testnets, isNetworkSupported);

    const showUnsupportedCoins =
        device?.features?.internal_model === DeviceModelInternal.T1B1 &&
        !hasBitcoinOnlyFirmware(device);

    return {
        supportedMainnets,
        unsupportedMainnets,
        supportedTestnets,
        unsupportedTestnets,
        showUnsupportedCoins,
    };
};
