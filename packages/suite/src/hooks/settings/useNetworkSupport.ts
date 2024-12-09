import { Network, getMainnets, getTestnets } from '@suite-common/wallet-config';
import { selectDevice, selectDeviceSupportedNetworks } from '@suite-common/wallet-core';
import { DeviceModelInternal } from '@trezor/connect';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { arrayPartition } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';

export const useNetworkSupport = () => {
    const device = useSelector(selectDevice);
    const isDebug = useSelector(selectIsDebugModeActive);
    const deviceSupportedNetworkSymbols = useSelector(selectDeviceSupportedNetworks);

    const mainnets = getMainnets(isDebug);
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
