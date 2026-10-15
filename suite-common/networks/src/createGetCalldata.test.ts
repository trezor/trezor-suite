import { createMockDeps } from '@trezor/dependency-injection';
import { type SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { mockGetCalldata } from '../mocks/mockGetCalldata';
import { createGetCalldata, type GetCalldataDeps } from './createGetCalldata';

const createModule = (
    calldata: SuiteCommonNetworkModule['calldata'],
): SuiteCommonNetworkModule => ({
    calldata,
    icon: {
        getIcons: () => ({ coin: 'coin.svg', network: 'network.svg' }),
        getIconPaths: () => ({ coin: 'coin.svg', network: 'network.svg' }),
    },
    addressValidator: { isAddressValid: () => true, getAddressType: () => undefined },
    getSupportedNetworks: () => [],
    getNetworkConfig: () => {
        throw new Error('Network configuration is unused.');
    },
    getAccountSyncInterval: () => 0,
});

it('returns the selected module capability without inventing unsupported operations', () => {
    const ethereum = createModule(mockGetCalldata()('eth'));
    const bitcoin = createModule(undefined);
    const deps = createMockDeps<GetCalldataDeps>({
        networkModuleRepository: {
            get: symbol => (symbol === 'eth' ? ethereum : bitcoin),
            getSupportedNetworks: null,
            isSupportedNetwork: null,
        },
    });
    const getCalldata = createGetCalldata(deps);

    expect(getCalldata(asNetworkSymbol('eth'))).toBe(ethereum.calldata);
    expect(getCalldata(asNetworkSymbol('btc'))).toBeUndefined();
    expect(getCalldata(undefined)).toBeUndefined();
    expect(deps.networkModuleRepository.get).toHaveBeenCalledTimes(2);
});
