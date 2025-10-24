import { Network, getMainnets, getTestnets } from '@suite-common/wallet-config';
import { selectDeviceSupportedNetworks, selectSelectedDevice } from '@suite-common/wallet-core';
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
    const deviceSupportedNetworkSymbols = useSelector(selectDeviceSupportedNetworks);

    const mainnets = getMainnets(isDebug, useExperimentalNetworks);
    const testnets = getTestnets(isDebug, useExperimentalNetworks);

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
