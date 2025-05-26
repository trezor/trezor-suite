import { Network, getMainnets, getNetworkType, getTestnets } from '@suite-common/wallet-config';
import { selectDeviceSupportedNetworks, selectSelectedDevice } from '@suite-common/wallet-core';
import { DeviceModelInternal, hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { arrayPartition } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';
import {
    selectHasExperimentalFeature,
    selectIsDebugModeActive,
} from 'src/reducers/suite/suiteReducer';

export const useNetworkSupport = () => {
    const device = useSelector(selectSelectedDevice);
    const isDebug = useSelector(selectIsDebugModeActive);
    const deviceSupportedNetworkSymbols = useSelector(selectDeviceSupportedNetworks);
    const isStellarSupportEnabled = useSelector(selectHasExperimentalFeature('stellar-support'));

    const mainnets = getMainnets(isDebug).filter(
        network => isStellarSupportEnabled || network.networkType !== 'stellar',
    );

    const testnets = getTestnets(isDebug).filter(
        network => isStellarSupportEnabled || getNetworkType(network.symbol) !== 'stellar',
    );

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
