import type { NetworkSymbol } from './NetworkModules';
import type { NetworksServices } from './NetworksServices';
import type * as NetworkServicesRegistry from './networkServicesRegistry';
import { mockAddressValidator } from '../mocks/mockAddressValidator';
import { mockFindNetworkSymbolForProtocol } from '../mocks/mockFindNetworkSymbolForProtocol';
import { mockGetNamedAddressSupport } from '../mocks/mockGetNamedAddressSupport';
import { mockGetNetworkConfig } from '../mocks/mockGetNetworkConfig';
import { mockGetSupportedNetworks } from '../mocks/mockGetSupportedNetworks';

describe('network services registry', () => {
    it('requires registration and returns the application-owned services, including replacements', () => {
        jest.isolateModules(() => {
            const { getNetworkServices, registerNetworkServices } = jest.requireActual<
                typeof NetworkServicesRegistry
            >('./networkServicesRegistry');
            const services: NetworksServices = {
                addressValidator: mockAddressValidator(),
                findNetworkSymbolForProtocol: mockFindNetworkSymbolForProtocol,
                getNamedAddressSupport: mockGetNamedAddressSupport(),
                getNetworkConfig: mockGetNetworkConfig,
                getSupportedNetworks: mockGetSupportedNetworks,
                isTestnet: () => false,
                isSupportedNetwork: (symbol): symbol is NetworkSymbol => symbol === 'btc',
            };

            expect(getNetworkServices).toThrow('Network services have not been registered.');

            registerNetworkServices(services);
            expect(getNetworkServices()).toBe(services);

            const replacement: NetworksServices = { ...services, isTestnet: () => true };
            registerNetworkServices(replacement);
            expect(getNetworkServices()).toBe(replacement);
        });
    });
});
