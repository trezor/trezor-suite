import { pipe, S, A } from '@mobily/ts-belt';

export const splitAddressToChunks = (address: string) =>
    pipe(address, S.toArray, A.splitEvery(4), A.map(A.join('')));
