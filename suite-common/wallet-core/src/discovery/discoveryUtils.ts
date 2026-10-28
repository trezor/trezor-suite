import { type TrezorDevice } from '@suite-common/suite-types';
import { isDirectRpcBackendType } from '@suite-common/wallet-utils';
import { type DeviceState } from '@trezor/connect';

import { type CreateAccountActionProps } from '../accounts/accountsActions';

/**
 * Discovery on a direct-RPC backend asks only whether an address is used, so an account it turns
 * up still has to be asked what it holds. Blockbook-backed accounts arrive with their tokens.
 */
export const shouldFetchAssetsAfterDiscovery = (account: CreateAccountActionProps) =>
    !account.failed && !account.accountInfo.empty && isDirectRpcBackendType(account.backendType);

export const describesSameWallet = (first: DeviceState) => {
    const firstParsed = first.staticSessionId?.split(':')[0];

    return (second?: DeviceState) =>
        firstParsed ? firstParsed === second?.staticSessionId?.split(':')[0] : false;
};

/**
 * Finds a wallet Suite already holds for `deviceState`, so that authorizing it again is reported as
 * a duplicate instead of adding a second entry for the same wallet.
 */
export const findDuplicateWallet = (
    devices: TrezorDevice[],
    device: TrezorDevice,
    deviceState: DeviceState,
) =>
    devices
        // Only the wallets of the device being authorized can be duplicates. Two distinct devices
        // recovered from the same seed describe the same wallet, yet each of them keeps its own
        // entry. Matching by `id` rather than by `path` keeps remembered instances of this device
        // in scope while it is not attached. An instance that was already detached when the
        // `device_id` changed keeps the pre-reset `id` forever, because `merge` in `deviceReducer`
        // re-keys only connected or path-matched entries, so for that one the duplicate is still
        // missed, just as it was before this filter.
        .filter(d => d.id === device.id)
        .map(d => d.state)
        .find(describesSameWallet(deviceState));
