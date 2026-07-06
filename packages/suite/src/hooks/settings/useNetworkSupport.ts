import { selectIsDebugModeActive } from '@suite/debug';
import { selectHasExperimentalFeature } from '@suite/settings';
import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import {
    type Network,
    getMainnets,
    getTestnets,
    selectNetworkAvailabilityDep,
} from '@suite-common/wallet-config';
import { selectDeviceSupportedNetworks } from '@suite-common/wallet-core';
import { DeviceModelInternal, hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { arrayPartition } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

export const useNetworkSupport = () => {
    const device = useSelector(selectSelectedDevice);
    const isDebug = useSelector(selectIsDebugModeActive);
    const useExperimentalNetworks = useSelector(
        selectHasExperimentalFeature('experimental-networks'),
    );
    const useTestnetNetworks = useSelector(selectHasExperimentalFeature('testnet-networks'));
    const deviceSupportedNetworkSymbols = useSelector(selectDeviceSupportedNetworks);
    // Whether desktop-only networks (e.g. Monero, which needs a locally managed full node) ship on
    // this build is injected by the platform's composition root — no `isDesktop()` branch here.
    const { networkAvailability } = useServices(selectNetworkAvailabilityDep);

    const mainnets = getMainnets({
        debug: isDebug,
        useExperimentalNetworks,
    }).filter(networkAvailability.isNetworkAvailableOnBuild);
    const testnets = getTestnets({
        debug: isDebug,
        useExperimentalNetworks,
        useTestnetNetworks,
    }).filter(networkAvailability.isNetworkAvailableOnBuild);

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
