import { asSuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';
import { asAccountDescriptor, asTxTargetId, asWalletDescriptor } from '@suite-common/wallet-types';

import {
    createAccountRowId,
    createAddressRowId,
    createOutputRowId,
    createOwnerIdFromSecret,
    createWalletRowId,
} from './createEvoluRowIds';

const networkSymbol = 'btc' as const;
const BTC_TX_ID = 'aa545d95cf07892e1ae70b40e856b9b476f703e2e20647d0985830fd7b734393';
const BTC_TX_TARGET_ID = '0';

// Ids for default mnemonic_12: 'alcohol woman abuse must during monitor noble actual mixed trade anger aisle'
export const ownerSecret = asSuiteSyncOwnerSecretHex(
    'd5cafbfc837fcdba7fd54025ce352fac369db9383d41d73dbd4f3353b63bc4644585f41195021419707ccdf76bbdf0b1cb0e11f07ff19a41b5f22602dfee3b63',
);
export const ownerId = createOwnerIdFromSecret(ownerSecret);
export const walletDescriptor = asWalletDescriptor('mkqRFzxmkCGX9jxgpqqFHcxRUmLJcLDBer');
export const accountDescriptor = asAccountDescriptor(
    'zpub6qSSRL9wLd6LNee7qjDEuULWccP5Vbm5nuX4geBu8zMCQBWsF5Jo5UswLVxFzcbCMr2yQPG27ZhDs1cUGKVH1RmqkG1PFHkEXyHG7EV3ogY',
);

export const walletSeed = {
    id: createWalletRowId(walletDescriptor),
    walletDescriptor,
    label: 'Evolu synced wallet',
};

export const accountSeed = {
    id: createAccountRowId(accountDescriptor, networkSymbol),
    accountDescriptor,
    networkSymbol,
    label: 'Evolu synced BTC account',
};

export const createAddressSeed = (address: string) => ({
    id: createAddressRowId(address, networkSymbol),
    label: 'Evolu synced BTC address',
    address,
    accountDescriptor,
    networkSymbol,
});

export const outputSeed = {
    id: createOutputRowId(BTC_TX_ID, asTxTargetId(BTC_TX_TARGET_ID)),
    accountDescriptor,
    label: 'Evolu synced output',
    networkSymbol,
    outputIndex: BTC_TX_TARGET_ID,
    txId: BTC_TX_ID,
};

export const buildExpectedWallet = <T extends string | null>({ label }: { label: T }) => ({
    updatedAt: null,
    isDeleted: null,
    ownerId,
    walletDescriptor,
    label,
});

export const buildExpectedAccount = <T extends string | null>({ label }: { label: T }) => ({
    updatedAt: null,
    isDeleted: null,
    ownerId,
    accountDescriptor,
    networkSymbol,
    label,
});

export const buildExpectedAddress = <T extends string | null>({
    address,
    label,
}: {
    address: string;
    label: T;
}) => ({
    updatedAt: null,
    isDeleted: null,
    ownerId,
    accountDescriptor,
    networkSymbol,
    address,
    label,
});

export const buildExpectedOutput = <T extends string | null>({
    txId,
    outputIndex,
    label,
}: {
    txId: string;
    outputIndex: string;
    label: T;
}) => ({
    updatedAt: null,
    isDeleted: null,
    ownerId,
    accountDescriptor,
    networkSymbol,
    txId,
    outputIndex,
    label,
});
