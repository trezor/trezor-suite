import {
    createAccountRowId,
    createAddressRowId,
    createOutputRowId,
    createWalletRowId,
} from '@suite-common/e2e-evolu-client';
import { asTxTargetId } from '@suite-common/wallet-types';

import { accountDescriptor, ownerId, ownerSecret, walletDescriptor } from './default-metadata-ids';

const networkSymbol = 'btc' as const;
const BTC_ADDRESS = 'bc1qkkr2uvry034tsj4p52za2pg42ug4pxg5qfxyfa';
const BTC_TX_ID = 'aa545d95cf07892e1ae70b40e856b9b476f703e2e20647d0985830fd7b734393';
const BTC_TX_TARGET_ID = '0';

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

export const addressSeed = {
    id: createAddressRowId(BTC_ADDRESS, networkSymbol),
    label: 'Evolu synced BTC address',
    address: BTC_ADDRESS,
    accountDescriptor,
    networkSymbol,
};

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

export { ownerSecret };
