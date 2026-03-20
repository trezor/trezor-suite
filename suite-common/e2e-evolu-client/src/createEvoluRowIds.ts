import { createIdFromString, getOrThrow } from '@evolu/common';

import {
    AccountEvoluId,
    AddressEvoluId,
    OutputEvoluId,
    WalletLabelId,
    createEvoluAppOwnerFromTrezorData,
} from '@suite-common/suite-sync-evolu';
import {
    createSuiteSyncAccountId,
    createSuiteSyncAddressId,
    createSuiteSyncOutputId,
} from '@suite-common/suite-sync-storage';
import type { SuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountDescriptor, TxTargetId, WalletDescriptor } from '@suite-common/wallet-types';

export const createOwnerIdFromSecret = (ownerSecret: SuiteSyncOwnerSecretHex): string => {
    const result = createEvoluAppOwnerFromTrezorData({ data: ownerSecret });
    if (!result.ok) {
        throw new Error(`Failed to compute ownerId: ${JSON.stringify(result.error)}`);
    }

    return result.value.id;
};

export const createWalletRowId = (walletDescriptor: WalletDescriptor) =>
    getOrThrow(WalletLabelId.from(createIdFromString(walletDescriptor)));

export const createAccountRowId = (
    accountDescriptor: AccountDescriptor,
    networkSymbol: NetworkSymbol,
) =>
    getOrThrow(
        AccountEvoluId.from(
            createIdFromString(createSuiteSyncAccountId(accountDescriptor, networkSymbol)),
        ),
    );

export const createAddressRowId = (address: string, networkSymbol: NetworkSymbol) =>
    getOrThrow(
        AddressEvoluId.from(createIdFromString(createSuiteSyncAddressId(address, networkSymbol))),
    );

export const createOutputRowId = (txId: string, txTargetId: TxTargetId) =>
    getOrThrow(OutputEvoluId.from(createIdFromString(createSuiteSyncOutputId(txId, txTargetId))));
