import type { NetworksRootState } from './networksReducer';
import { networksActions, networksReducer } from './networksReducer';
import { selectNetworkConfigAccessors } from './selectNetworkConfigAccessors';
import { mockNetworkMetadata } from '../mocks/mockNetworkMetadata';

it('reads only the configurations loaded in the selected store', () => {
    const bitcoin = { ...mockNetworkMetadata.btc, name: 'Store Bitcoin' };
    const state: NetworksRootState = {
        networks: networksReducer(undefined, networksActions.setNetworks([bitcoin])),
    };

    const deps = selectNetworkConfigAccessors(state);

    expect(deps.getNetworkConfig('btc')).toEqual(bitcoin);
    expect(deps.getNetworkConfigs()).toEqual([bitcoin]);
    expect(() => deps.getNetworkConfig('eth')).toThrow('not loaded');
    expect(selectNetworkConfigAccessors(state)).toBe(deps);
});

it('keeps separate store configurations isolated', () => {
    const first: NetworksRootState = {
        networks: networksReducer(
            undefined,
            networksActions.setNetworks([mockNetworkMetadata.btc]),
        ),
    };
    const second: NetworksRootState = {
        networks: networksReducer(
            undefined,
            networksActions.setNetworks([mockNetworkMetadata.eth]),
        ),
    };

    expect(
        selectNetworkConfigAccessors(first)
            .getNetworkConfigs()
            .map(network => network.symbol),
    ).toEqual(['btc']);
    expect(
        selectNetworkConfigAccessors(second)
            .getNetworkConfigs()
            .map(network => network.symbol),
    ).toEqual(['eth']);
});

it('returns no configurations before modules are loaded', () => {
    expect(selectNetworkConfigAccessors({ networks: null }).getNetworkConfigs()).toEqual([]);
});
