import { type StorageId } from '@suite-common/suite-sync-types';
import type { StaticSessionId } from '@trezor/connect';
import { parseStaticSessionId } from '@trezor/device-utils';

export const createStorageIdFromDeviceStaticSessionId = (
    deviceStaticSessionId: StaticSessionId,
) => {
    const { walletDescriptor } = parseStaticSessionId(deviceStaticSessionId);

    return walletDescriptor as unknown as StorageId;
};
