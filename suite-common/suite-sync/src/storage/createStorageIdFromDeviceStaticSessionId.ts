import { type StorageId } from '@suite-common/suite-sync-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import type { StaticSessionId } from '@trezor/connect';

export const createStorageIdFromDeviceStaticSessionId = (
    deviceStaticSessionId: StaticSessionId,
) => {
    const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

    return walletDescriptor as unknown as StorageId;
};
