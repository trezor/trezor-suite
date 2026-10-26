import { asGetter, createMockDeps } from '@trezor/dependency-injection';
import type {
    BackendType,
    NetworkSuiteCommonModuleApi,
} from '@trezor/network-module-suite-common-types';

import { asNetworkSymbol } from './NetworkModules';
import { type GetNetworkDeps, createGetNetwork } from './createGetNetwork';
import { createNetworkFamiliesCompositionRoot } from './createNetworkFamiliesCompositionRoot';

const createTestGetNetwork = () => {
    const backend: { current: BackendType } = { current: 'blockbook' };
    const deps: GetNetworkDeps = {
        networkFamilies: createNetworkFamiliesCompositionRoot(
            createMockDeps<NetworkSuiteCommonModuleApi>({ getTrezorConnect: null }),
        ),
        getNetworkBackend: asGetter(() => backend.current),
    };

    return { getNetwork: createGetNetwork(deps), backend };
};

describe('createGetNetwork', () => {
    it('resolves a network through the family serving its symbol', () => {
        const { getNetwork } = createTestGetNetwork();

        const network = getNetwork({ symbol: asNetworkSymbol('btc') });

        expect(network?.family).toBe('bitcoin');
        expect(network?.context).toEqual({ symbol: 'btc', backend: 'blockbook' });
        expect(network?.capabilities.messageSigning).toBeDefined();
    });

    it('resolves the capabilities of the account type', () => {
        const { getNetwork } = createTestGetNetwork();

        expect(
            getNetwork({ symbol: asNetworkSymbol('btc'), accountType: 'taproot' })?.capabilities
                .messageSigning,
        ).toBeUndefined();
    });

    it('keeps the network object while its context stays the same', () => {
        const { getNetwork } = createTestGetNetwork();
        const symbol = asNetworkSymbol('eth');

        expect(getNetwork({ symbol })).toBe(getNetwork({ symbol }));
    });

    it('resolves a new network when the backend changes', () => {
        const { getNetwork, backend } = createTestGetNetwork();
        const symbol = asNetworkSymbol('eth');
        const onBlockbook = getNetwork({ symbol });

        backend.current = 'evm-rpc';
        const onRpc = getNetwork({ symbol });

        expect(onRpc).not.toBe(onBlockbook);
        expect(onRpc?.context.backend).toBe('evm-rpc');
    });

    it('resolves networks without capabilities and nothing for unknown symbols', () => {
        const { getNetwork } = createTestGetNetwork();

        expect(getNetwork({ symbol: asNetworkSymbol('sol') })?.capabilities).toEqual({});
        expect(getNetwork({ symbol: asNetworkSymbol('zzz') })).toBeUndefined();
        expect(getNetwork({ symbol: undefined })).toBeUndefined();
    });
});
