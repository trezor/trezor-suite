import {
    AccountEvoluSchema,
    AddressEvoluSchema,
    EvoluOutput,
    WalletEvoluSchema,
} from '@suite-common/suite-sync-evolu';
import { asSuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';
import type { SuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';
import { asAccountDescriptor, asTxTargetId, asWalletDescriptor } from '@suite-common/wallet-types';
import type { AccountDescriptor, WalletDescriptor } from '@suite-common/wallet-types';

import {
    createAccountRowId,
    createAddressRowId,
    createOutputRowId,
    createOwnerIdFromSecret,
    createWalletRowId,
} from './createEvoluRowIds';

const networkSymbol = 'btc' as const;
const BTC_TX_TARGET_ID = '0';

type SuiteSyncFixtureParams = {
    ownerSecret: SuiteSyncOwnerSecretHex;
    walletDescriptor: WalletDescriptor;
    accountDescriptor: AccountDescriptor;
    defaultTxId: string;
};

type WithNonNullLabel<T extends { label: unknown }> = Omit<T, 'label'> & {
    label: NonNullable<T['label']>;
};

type WalletSeed = WithNonNullLabel<ReturnType<typeof WalletEvoluSchema.orThrow>>;
type AccountSeed = WithNonNullLabel<ReturnType<typeof AccountEvoluSchema.orThrow>>;
type AddressSeed = WithNonNullLabel<ReturnType<typeof AddressEvoluSchema.orThrow>>;
type OutputSeed = WithNonNullLabel<ReturnType<typeof EvoluOutput.orThrow>>;

const createSuiteSyncFixtures = ({
    ownerSecret,
    walletDescriptor,
    accountDescriptor,
    defaultTxId,
}: SuiteSyncFixtureParams) => {
    const ownerId = createOwnerIdFromSecret(ownerSecret);

    const walletSeed = WalletEvoluSchema.orThrow({
        id: createWalletRowId(walletDescriptor),
        walletDescriptor,
        label: 'Evolu synced wallet',
    }) as WalletSeed;

    const accountSeed = AccountEvoluSchema.orThrow({
        id: createAccountRowId(accountDescriptor, networkSymbol),
        accountDescriptor,
        networkSymbol,
        label: 'Evolu synced BTC account',
    }) as AccountSeed;

    const createAddressSeed = (address: string) =>
        AddressEvoluSchema.orThrow({
            id: createAddressRowId(address, networkSymbol),
            label: 'Evolu synced BTC address',
            address,
            accountDescriptor,
            networkSymbol,
        }) as AddressSeed;

    const createOutputSeed = (txId: string = defaultTxId, outputIndex: string = BTC_TX_TARGET_ID) =>
        EvoluOutput.orThrow({
            id: createOutputRowId(txId, asTxTargetId(outputIndex)),
            accountDescriptor,
            label: 'Evolu synced output',
            networkSymbol,
            outputIndex,
            txId,
        }) as OutputSeed;

    const buildExpectedWallet = <T extends string | null>({ label }: { label: T }) => ({
        id: createWalletRowId(walletDescriptor),
        updatedAt: null,
        isDeleted: null,
        ownerId,
        walletDescriptor,
        label,
    });

    const buildExpectedAccount = <T extends string | null>({ label }: { label: T }) => ({
        id: createAccountRowId(accountDescriptor, networkSymbol),
        updatedAt: null,
        isDeleted: null,
        ownerId,
        accountDescriptor,
        networkSymbol,
        label,
    });

    const buildExpectedAddress = <T extends string | null>({
        address,
        label,
    }: {
        address: string;
        label: T;
    }) => ({
        id: createAddressRowId(address, networkSymbol),
        updatedAt: null,
        isDeleted: null,
        ownerId,
        accountDescriptor,
        networkSymbol,
        address,
        label,
    });

    const buildExpectedOutput = <T extends string | null>({
        txId,
        outputIndex,
        label,
    }: {
        txId: string;
        outputIndex: string;
        label: T;
    }) => ({
        id: createOutputRowId(txId, asTxTargetId(outputIndex)),
        updatedAt: null,
        isDeleted: null,
        ownerId,
        accountDescriptor,
        networkSymbol,
        txId,
        outputIndex,
        label,
    });

    return {
        ownerSecret,
        ownerId,
        walletDescriptor,
        accountDescriptor,
        defaultTxId,
        walletSeed,
        accountSeed,
        createAddressSeed,
        createOutputSeed,
        buildExpectedWallet,
        buildExpectedAccount,
        buildExpectedAddress,
        buildExpectedOutput,
    };
};

// mnemonic_12: 'alcohol woman abuse must during monitor noble actual mixed trade anger aisle'
export const mnemonic12Fixtures = createSuiteSyncFixtures({
    ownerSecret: asSuiteSyncOwnerSecretHex(
        'd5cafbfc837fcdba7fd54025ce352fac369db9383d41d73dbd4f3353b63bc4644585f41195021419707ccdf76bbdf0b1cb0e11f07ff19a41b5f22602dfee3b63',
    ),
    walletDescriptor: asWalletDescriptor('mkqRFzxmkCGX9jxgpqqFHcxRUmLJcLDBer'),
    accountDescriptor: asAccountDescriptor(
        'zpub6qSSRL9wLd6LNee7qjDEuULWccP5Vbm5nuX4geBu8zMCQBWsF5Jo5UswLVxFzcbCMr2yQPG27ZhDs1cUGKVH1RmqkG1PFHkEXyHG7EV3ogY',
    ),
    defaultTxId: 'aa545d95cf07892e1ae70b40e856b9b476f703e2e20647d0985830fd7b734393',
});

// mnemonic_immune: 'immune enlist rule measure fan swarm mandate track point menu security fan'
export const immuneFixtures = createSuiteSyncFixtures({
    ownerSecret: asSuiteSyncOwnerSecretHex(
        '74996d3c1cba903286c811606d22faf8b0e4d4405a2f25d13debd625481557f7d73990b87caa057dba5d61bac6ec2563f538fc5e365c73ff59479f1e482673b0',
    ),
    walletDescriptor: asWalletDescriptor('mt5WPmXL77AJwhCPPv6Gct3UtiuVUMieXJ'), // TODO: verify
    accountDescriptor: asAccountDescriptor(
        'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
    ),
    defaultTxId: 'ab832618b1b6e5f82c39f87ec9fda14c0df44a2ce9c32f663bf234ca0b1fe1ab',
});
