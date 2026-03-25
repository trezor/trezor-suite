import { isTrezorDeviceWithState } from '@suite-common/device';
import type { SelectAllLabelsForAccountParams } from '@suite-common/suite-sync';
import type { TrezorDevice, TrezorDeviceWithState } from '@suite-common/suite-types';
import type { Account } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';

export const normalizeLabel = (label: string | undefined) => {
    const trimmedLabel = label?.trim();

    return trimmedLabel ? trimmedLabel : null;
};

export const createAccountLabelsParams = (account: Account): SelectAllLabelsForAccountParams => {
    const { walletDescriptor } = parseDeviceStaticSessionId(account.deviceState);

    return {
        walletDescriptor,
        accountDescriptor: account.descriptor,
        networkSymbol: account.symbol,
    };
};

export const getConnectedMigratableDevices = (
    devices: TrezorDevice[] | undefined,
): TrezorDeviceWithState[] =>
    devices?.reduce<TrezorDeviceWithState[]>((result, device) => {
        if (isTrezorDeviceWithState(device) && device.connected && device.available) {
            result.push(device);
        }

        return result;
    }, []) ?? [];
