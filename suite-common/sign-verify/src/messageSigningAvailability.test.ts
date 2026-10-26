import {
    type GetNetworkDeps,
    createGetNetwork,
    createNetworkFamiliesCompositionRoot,
} from '@suite-common/networks';
import {
    type AccountType,
    type BackendType,
    networksCollection,
} from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { asGetter, createMockDeps } from '@trezor/dependency-injection';
import type { NetworkSuiteCommonModuleApi } from '@trezor/network-module-suite-common-types';
import { typedObjectKeys } from '@trezor/utils';

// Every network, account type and backend the app can combine, so the capability cannot drift
// from the feature flags the rest of the app still reads.
const contexts = networksCollection.flatMap(network => {
    const accountTypes: AccountType[] = ['normal', ...typedObjectKeys(network.accountTypes)];
    const backends: BackendType[] = network.backendOptions.map(option => option.type);

    return accountTypes.flatMap(accountType =>
        backends.map(backend => ({ symbol: network.symbol, accountType, backend })),
    );
});

describe('message signing availability', () => {
    it.each(contexts)(
        'matches the sign-verify feature for $symbol $accountType on $backend',
        ({ symbol, accountType, backend }) => {
            const deps: GetNetworkDeps = {
                networkFamilies: createNetworkFamiliesCompositionRoot(
                    createMockDeps<NetworkSuiteCommonModuleApi>({ getTrezorConnect: null }),
                ),
                getNetworkBackend: asGetter(() => backend),
            };
            const getNetwork = createGetNetwork(deps);
            const account = mockWalletAccount({ symbol, accountType });

            const hasCapability =
                getNetwork({ symbol, accountType })?.capabilities.messageSigning !== undefined;

            expect(hasCapability).toBe(hasNetworkFeatures(account, 'sign-verify'));
        },
    );
});
