import { createEthereumSuiteCommonNetworkModule } from '@trezor/network-ethereum-suite-common';

import { createGetNamedAddressSupport } from './createGetNamedAddressSupport';

describe('createGetNamedAddressSupport', () => {
    const ethereumModule = createEthereumSuiteCommonNetworkModule({
        getTrezorConnect: () => ({ getAccountInfo: jest.fn(), blockchainEvmRpcCall: jest.fn() }),
    });
    const networkModuleRepository = {
        get: jest.fn().mockImplementation(symbol => (symbol === 'btc' ? {} : ethereumModule)),
    };
    const getNamedAddressSupport = createGetNamedAddressSupport({ networkModuleRepository });

    it('hands out a resolver for a network with a name system', () => {
        const support = getNamedAddressSupport('eth');

        expect(support.isSupported).toBe(true);
        expect(support.isSupported && support.resolver.isNameLike('vitalik.eth')).toBe(true);
        expect(support.isNameLike('vitalik.eth')).toBe(true);
    });

    it('recognizes names on a network whose module cannot resolve them', () => {
        const support = getNamedAddressSupport('base');

        expect(support.isSupported).toBe(false);
        expect(support.isNameLike('vitalik.eth')).toBe(true);
    });

    it('recognizes no names on a network without a name system', () => {
        const support = getNamedAddressSupport('btc');

        expect(support.isSupported).toBe(false);
        expect(support.isNameLike('vitalik.eth')).toBe(false);
    });

    it('reports no support without a symbol', () => {
        expect(getNamedAddressSupport(null).isSupported).toBe(false);
        expect(getNamedAddressSupport(undefined).isNameLike('vitalik.eth')).toBe(false);
    });
});
