import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountDescriptor } from '@suite-common/wallet-types';
import { type Branded } from '@trezor/type-utils';

import { type SuiteSyncTable } from '../SuiteSyncTable';

export type SuiteSyncAddressId = string & Branded<'SuiteSyncAddressId'>;

export const createSuiteSyncAddressId = (address: string, networkSymbol: NetworkSymbol) =>
    `${address}-${networkSymbol}` as SuiteSyncAddressId;

export type SuiteSyncAddress = {
    id: SuiteSyncAddressId;
    address: string;
    label: string | null;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
};

export type AddressTable = SuiteSyncTable<SuiteSyncAddress>;
