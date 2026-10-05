import { createMockDeps } from '@trezor/dependency-injection';
import { type NetworkConfigState, asNetworkSymbol } from '@trezor/network-module-types';

import { type ShouldShowNetworkIconDeps, shouldShowNetworkIcon } from './tokenIconUtils';

it('shows token network badges only when the configuration and icon support them', () => {
    const bsc = asNetworkSymbol('bsc');
    const state: NetworkConfigState = {
        networks: {
            [bsc]: { name: 'BNB Smart Chain', displaySymbol: 'BNB', features: ['tokens'] },
        },
    };
    const deps = createMockDeps<ShouldShowNetworkIconDeps>({
        hasNetworkIcon: (symbol): symbol is typeof bsc => symbol === bsc,
    });

    expect(shouldShowNetworkIcon(deps, state, bsc, 'contract')).toBe(true);
    expect(shouldShowNetworkIcon(deps, state, bsc, null)).toBe(false);
    expect(shouldShowNetworkIcon(deps, state, undefined, 'contract')).toBe(false);
    expect(shouldShowNetworkIcon(deps, state, asNetworkSymbol('unregistered'), 'contract')).toBe(
        false,
    );

    const updatedState: NetworkConfigState = {
        networks: {
            [bsc]: { name: 'BNB Smart Chain', displaySymbol: 'BNB', features: [] },
        },
    };
    expect(shouldShowNetworkIcon(deps, updatedState, bsc, 'contract')).toBe(false);
    expect(shouldShowNetworkIcon(deps, { networks: null }, bsc, 'contract')).toBe(false);

    deps.hasNetworkIcon.mockReturnValue(false);
    expect(shouldShowNetworkIcon(deps, state, bsc, 'contract')).toBe(false);
});
