import { A, pipe, S } from '@mobily/ts-belt';
import { RequireAllOrNone } from 'type-fest';

import { splitAddressToChunks } from '@suite-native/helpers';
import { DeviceModelInternal } from '@trezor/connect';

import { DevicePaginationActivePage } from './types';

const T1B1_SCREEN_LINE_LENGTH = 21;
const LEGACY_SEGWIT_ADDRESS_LENGTH = 34;

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
        // Legacy Segwit address is only 34 characters long. T1B1 displays it in two lines, 17 characters each for a symmetric look.
        // Any other address takes the full line length.
        const charactersPerLine =
            address.length === LEGACY_SEGWIT_ADDRESS_LENGTH
                ? LEGACY_SEGWIT_ADDRESS_LENGTH / 2
                : T1B1_SCREEN_LINE_LENGTH;

        return pipe(address, S.toArray, A.splitEvery(charactersPerLine), A.map(A.join('')));
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
