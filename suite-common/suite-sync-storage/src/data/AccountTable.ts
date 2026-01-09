import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountDescriptor } from '@suite-common/wallet-types';
import { Branded } from '@trezor/type-utils';

import { SuiteSyncTable } from '../SuiteSyncTable';

export type SuiteSyncAccountId = string & Branded<'SuiteSyncAccountId'>;

export const createSuiteSyncAccountId = (
    accountDescriptor: AccountDescriptor,
    networkSymbol: NetworkSymbol,
) => `${accountDescriptor}-${networkSymbol}` as SuiteSyncAccountId;

export type SuiteSyncAccount = {
    id: SuiteSyncAccountId;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
    label: string | null;
};

export type AccountTable = SuiteSyncTable<SuiteSyncAccount>;
