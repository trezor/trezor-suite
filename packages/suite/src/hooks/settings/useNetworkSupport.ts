import { selectSelectedDevice } from '@suite-common/device';
import { type Network, getMainnets, getTestnets } from '@suite-common/wallet-config';
import { selectDeviceSupportedNetworks } from '@suite-common/wallet-core';
import { DeviceModelInternal, hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { arrayPartition } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';
import {
    selectHasExperimentalFeature,
    selectIsDebugModeActive,
} from 'src/selectors/suite/suiteSelectors';

export const useNetworkSupport = () => {
    const device = useSelector(selectSelectedDevice);
    const isDebug = useSelector(selectIsDebugModeActive);
    const useExperimentalNetworks = useSelector(
        selectHasExperimentalFeature('experimental-networks'),
    );
    const useTronViewOnly = useSelector(selectHasExperimentalFeature('tron-view-only'));
    const useTestnetNetworks = useSelector(selectHasExperimentalFeature('testnet-networks'));
    const deviceSupportedNetworkSymbols = useSelector(selectDeviceSupportedNetworks);

    const mainnets = getMainnets({
        debug: isDebug,
        useExperimentalNetworks,
        includeTron: useTronViewOnly,
    });
    const testnets = getTestnets({ debug: isDebug, useExperimentalNetworks, useTestnetNetworks });

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
