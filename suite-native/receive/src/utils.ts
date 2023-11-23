import { A, pipe, S } from '@mobily/ts-belt';
import { RequireAllOrNone } from 'type-fest';

import { splitAddressToChunks } from '@suite-native/helpers';
import { DeviceModelInternal } from '@trezor/connect';

import { DevicePaginationActivePage } from './types';

const filterAddressChunksByPagination = (
    addressChunks: readonly string[],
    activePage: DevicePaginationActivePage,
) => {
    const paginationEmptyChunk = '    ';
    if (activePage === 1) {
        return [...addressChunks.slice(0, 15), paginationEmptyChunk];
    }

    return [paginationEmptyChunk, ...A.sliceToEnd(addressChunks, 15)];
};

export const parseAddressToDeviceLines = ({
    address,
    deviceModel,
    activePage,
    isPaginationEnabled,
}: RequireAllOrNone<
    {
        address: string;
        deviceModel: DeviceModelInternal;
        activePage?: DevicePaginationActivePage;
        isPaginationEnabled?: boolean;
    },
    'isPaginationEnabled' | 'activePage'
>) => {
    // T1B1 does not have support fro address chunking
    if (deviceModel === DeviceModelInternal.T1B1) {
        return pipe(address, S.toArray, A.splitEvery(21), A.map(A.join('')));
    }

    return pipe(
        address,
        splitAddressToChunks,
        addressChunks => {
            if (!isPaginationEnabled) return addressChunks;
            return filterAddressChunksByPagination(addressChunks, activePage);
        },
        A.splitEvery(4),
        A.map(A.join(' ')),
    );
};
