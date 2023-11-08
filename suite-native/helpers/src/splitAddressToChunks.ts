import { pipe, S, A } from '@mobily/ts-belt';

export const splitAddressToChunks = (address: string): readonly string[] => {
    if (S.isEmpty(address)) return [];

    return pipe(address, S.toArray, A.splitEvery(4), A.map(A.join('')));
};
