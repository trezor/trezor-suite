import {
    type GetNetworkDeps,
    createGetNetwork,
    createNetworkFamiliesCompositionRoot,
} from '@suite-common/networks';
import {
    type AccountType,
    type BackendType,
    type NetworkType,
    networksCollection,
} from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { asGetter, createMockDeps } from '@trezor/dependency-injection';
import type {
    NetworkSuiteCommonModuleApi,
    SendOptionSet,
} from '@trezor/network-module-suite-common-types';
import { typedObjectKeys } from '@trezor/utils';

// What the send form offered by network type before the options came from the network.
const offeredBefore: Record<keyof SendOptionSet, readonly NetworkType[]> = {
    memo: ['ripple', 'stellar', 'solana', 'tron'],
    data: ['ethereum', 'tron'],
    nonceOverride: ['ethereum'],
    multipleRecipients: ['bitcoin', 'cardano'],
    importRecipients: ['bitcoin'],
    dataOutput: ['bitcoin'],
    locktime: ['bitcoin'],
    coinControl: ['bitcoin'],
    broadcastToggle: ['bitcoin', 'ethereum', 'ripple', 'stellar'],
};

const memoProminenceBefore: Partial<Record<NetworkType, 'recipient' | 'optional'>> = {
    ripple: 'recipient',
    stellar: 'recipient',
    solana: 'optional',
    tron: 'optional',
};

// Every network, account type and backend the app can combine.
const contexts = networksCollection.flatMap(network => {
    const accountTypes: AccountType[] = ['normal', ...typedObjectKeys(network.accountTypes)];
    const backends: BackendType[] = network.backendOptions.map(option => option.type);

    return accountTypes.flatMap(accountType =>
        backends.map(backend => ({
            symbol: network.symbol,
            networkType: network.networkType,
            accountType,
            backend,
        })),
    );
});

const getOptions = (
    { symbol, accountType, backend }: (typeof contexts)[number],
    token?: { contract: string; standard?: string },
) => {
    const getNetwork = createGetNetwork({
        networkFamilies: createNetworkFamiliesCompositionRoot(
            createMockDeps<NetworkSuiteCommonModuleApi>({ getTrezorConnect: null }),
        ),
        getNetworkBackend: asGetter(() => backend),
    } satisfies GetNetworkDeps);

    return getNetwork({ symbol, accountType })?.capabilities.sendOptions?.getOptions({
        account: mockWalletAccount({ symbol, accountType }),
        token,
    });
};

describe('send options availability', () => {
    it.each(contexts)(
        'offers what the form offered before for $symbol $accountType on $backend',
        context => {
            const options = getOptions(context) ?? {};

            typedObjectKeys(offeredBefore).forEach(option => {
                expect([option, options[option] !== undefined]).toEqual([
                    option,
                    offeredBefore[option].includes(context.networkType),
                ]);
            });
            expect(options.memo?.prominence).toBe(memoProminenceBefore[context.networkType]);
        },
    );

    it.each(
        contexts.filter(({ networkType }) => networkType === 'ethereum' || networkType === 'tron'),
    )('keeps call data off token transfers for $symbol', context => {
        expect(getOptions(context)?.data?.unavailable).toBeUndefined();
        expect(getOptions(context, { contract: 'token' })?.data?.unavailable).toBeDefined();
    });

    it('refuses a memo on a Stellar contract token, which moves in a Soroban transaction', () => {
        const stellar = contexts.find(({ networkType }) => networkType === 'stellar');

        if (stellar === undefined) throw new Error('Stellar is expected among the networks.');

        expect(
            getOptions(stellar, { contract: 'C', standard: 'STELLAR-CONTRACT' })?.memo?.unavailable,
        ).toBeDefined();
        expect(
            getOptions(stellar, { contract: 'G', standard: 'STELLAR-CLASSIC' })?.memo?.unavailable,
        ).toBeUndefined();
    });
});
