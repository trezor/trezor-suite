import { selectIsDebugModeActive } from '@suite/debug';
import { selectHasExperimentalFeature, selectIsTestnetNetworksEnabled } from '@suite/settings';
import { selectSelectedDevice } from '@suite-common/device';
import {
    type Network,
    getMainnets,
    getTestnets,
    networksCollection,
} from '@suite-common/wallet-config';
import { selectCustomEvmNetworks, selectDeviceSupportedNetworks } from '@suite-common/wallet-core';
import { isCustomEvmNetworkSymbol } from '@suite-common/wallet-types';
import { DeviceModelInternal, hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { arrayPartition } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

export const useNetworkSupport = () => {
    const device = useSelector(selectSelectedDevice);
    const isDebug = useSelector(selectIsDebugModeActive);
    const useExperimentalNetworks = useSelector(
        selectHasExperimentalFeature('experimental-networks'),
    );
    const useTestnetNetworks = useSelector(selectIsTestnetNetworksEnabled);
    const deviceSupportedNetworkSymbols = useSelector(selectDeviceSupportedNetworks);
    const customEvmNetworks = useSelector(selectCustomEvmNetworks);

    // A removed custom network can outlive its registration in the network collection, so the
    // persisted definitions decide which custom networks are listed.
    const allNetworks = networksCollection.filter(
        network =>
            !isCustomEvmNetworkSymbol(network.symbol) ||
            customEvmNetworks.some(({ symbol }) => symbol === network.symbol),
    );

    const mainnets = getMainnets({
        debug: isDebug,
        useExperimentalNetworks,
        allNetworks,
    });
    const testnets = getTestnets({
        debug: isDebug,
        useExperimentalNetworks,
        useTestnetNetworks,
        allNetworks,
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
