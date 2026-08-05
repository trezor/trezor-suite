import type { TrezorDevice } from '@suite-common/suite-types';
import { isWrappedNativeToken } from '@suite-common/wallet-utils';
import { DeviceModelInternal, getFirmwareVersionArray } from '@trezor/device-utils';
import { type VersionArray, versionUtils } from '@trezor/utils';

import type { YieldFlowDisplayToken, YieldFlowType } from './stablecoinYieldTypes';

/**
 * Wrap/unwrap and the wrapped-native (WETH) vault calldata are clear-signed only from this
 * firmware; older versions would show a raw function signature (trezor/trezor-suite#30848).
 */
const WRAPPED_NATIVE_MIN_FIRMWARE: VersionArray = [2, 12, 4];

const hasMinFirmware = (device: TrezorDevice | undefined, minVersion: VersionArray): boolean => {
    // The firmware gates target the T2+ line only; T1B1 versions its firmware as 1.x.
    if (device?.features?.internal_model === DeviceModelInternal.T1B1) {
        return true;
    }

    const firmware = getFirmwareVersionArray(device);

    return firmware !== null && versionUtils.isNewerOrEqual(firmware, minVersion);
};

export const isWrappedNativeFlowSupported = (device: TrezorDevice | undefined): boolean =>
    hasMinFirmware(device, WRAPPED_NATIVE_MIN_FIRMWARE);

/** Input token of the vault being entered/exited; wrapped-native vaults need newer firmware. */
export type StablecoinYieldVaultToken = Pick<
    YieldFlowDisplayToken,
    'networkSymbol' | 'contractAddress'
>;

type StablecoinYieldSupportOptions = {
    flowType?: YieldFlowType;
    vaultToken?: StablecoinYieldVaultToken;
};

const getYieldMinFirmware = ({
    flowType,
    vaultToken,
}: StablecoinYieldSupportOptions): VersionArray => {
    if (vaultToken && isWrappedNativeToken(vaultToken.networkSymbol, vaultToken.contractAddress)) {
        return WRAPPED_NATIVE_MIN_FIRMWARE;
    }

    return flowType === 'claim' ? [2, 12, 1] : [2, 12, 0];
};

export const isStablecoinYieldSupported = (
    device: TrezorDevice | undefined,
    options: StablecoinYieldSupportOptions = {},
): boolean => hasMinFirmware(device, getYieldMinFirmware(options));
