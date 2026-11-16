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
import { asGetter, createMockDeps } from '@trezor/dependency-injection';
import type {
    NetworkSuiteCommonModuleApi,
    SendOptions,
} from '@trezor/network-module-suite-common-types';
import { typedObjectKeys } from '@trezor/utils';

// What the send form offered by network type before the options came from the network.
const offeredBefore: Record<keyof SendOptions, readonly NetworkType[]> = {
    memo: ['ripple', 'stellar', 'solana', 'tron'],
    data: ['ethereum', 'tron'],
    nonce: ['ethereum'],
    recipients: ['bitcoin', 'cardano'],
    locktime: ['bitcoin'],
    coinSelection: ['bitcoin'],
    dataOutput: ['bitcoin'],
    deferredBroadcast: ['bitcoin', 'ethereum', 'ripple', 'stellar'],
};

// Networks whose memo was shown with every recipient rather than added from the menu.
const memoWithEveryRecipientBefore: readonly NetworkType[] = ['ripple', 'stellar'];
const recipientImportBefore: readonly NetworkType[] = ['bitcoin'];

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

const getSendOptions = ({ symbol, accountType, backend }: (typeof contexts)[number]) =>
    createGetNetwork({
        networkFamilies: createNetworkFamiliesCompositionRoot(
            createMockDeps<NetworkSuiteCommonModuleApi>({ getTrezorConnect: null }),
        ),
        getNetworkBackend: asGetter(() => backend),
    } satisfies GetNetworkDeps)({ symbol, accountType })?.capabilities.sendOptions ?? {};

const findContext = (networkType: NetworkType) => {
    const context = contexts.find(candidate => candidate.networkType === networkType);

    if (context === undefined) throw new Error(`${networkType} is expected among the networks.`);

    return context;
};

describe('send options availability', () => {
    it.each(contexts)(
        'offers what the form offered before for $symbol $accountType on $backend',
        context => {
            const options = getSendOptions(context);

            typedObjectKeys(offeredBefore).forEach(option => {
                expect([option, options[option] !== undefined]).toEqual([
                    option,
                    offeredBefore[option].includes(context.networkType),
                ]);
            });
            expect(options.memo?.identifiesRecipient ?? false).toBe(
                memoWithEveryRecipientBefore.includes(context.networkType),
            );
            expect(options.recipients?.canImport ?? false).toBe(
                recipientImportBefore.includes(context.networkType),
            );
        },
    );

    it.each(['ethereum', 'tron'] as const)('keeps call data off token transfers on %s', type => {
        const { data } = getSendOptions(findContext(type));

        expect(data?.isAllowed({})).toBe(true);
        expect(data?.isAllowed({ token: { contract: 'token' } })).toBe(false);
    });

    it('refuses a memo on a Stellar contract token, which moves in a Soroban transaction', () => {
        const { memo } = getSendOptions(findContext('stellar'));

        expect(
            memo?.getUnavailableReason({ token: { contract: 'C', standard: 'STELLAR-CONTRACT' } }),
        ).toBeDefined();
        expect(
            memo?.getUnavailableReason({ token: { contract: 'G', standard: 'STELLAR-CLASSIC' } }),
        ).toBeUndefined();
    });

    it.each(['ripple', 'stellar'] as const)(
        'refuses an empty memo that is turned on, on %s',
        type => {
            expect(getSendOptions(findContext(type)).memo?.validate('')).toBeDefined();
        },
    );

    it.each(['solana', 'tron'] as const)('accepts an empty memo on %s', type => {
        expect(getSendOptions(findContext(type)).memo?.validate('')).toBeUndefined();
    });

    it('refuses a Tron note over its byte limit', () => {
        expect(getSendOptions(findContext('tron')).memo?.validate('x'.repeat(513))).toBeDefined();
    });
});
