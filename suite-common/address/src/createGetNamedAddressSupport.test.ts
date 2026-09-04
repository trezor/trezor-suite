import {
    createNetworkModuleRepository,
    createNetworksCompositionRoot,
} from '@suite-common/networks';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { createGetNamedAddressSupport } from './createGetNamedAddressSupport';

describe('createGetNamedAddressSupport', () => {
    const networkModules = createNetworksCompositionRoot();
    const networkModuleRepository = createNetworkModuleRepository({ networkModules });
    const getNamedAddressSupport = createGetNamedAddressSupport({ networkModuleRepository });

    it('hands out a resolver for a network with a name system', () => {
        const support = getNamedAddressSupport(asNetworkSymbol('eth'));

        expect(support.isSupported).toBe(true);
        expect(support.isSupported && support.resolver.isNameLike('vitalik.eth')).toBe(true);
        expect(support.isNameLike('vitalik.eth')).toBe(true);
    });

    it('recognizes names on a network whose module cannot resolve them', () => {
        const support = getNamedAddressSupport(asNetworkSymbol('base'));

        expect(support.isSupported).toBe(false);
        expect(support.isNameLike('vitalik.eth')).toBe(true);
    });

    it('recognizes no names on a network without a name system', () => {
        const support = getNamedAddressSupport(asNetworkSymbol('btc'));

        expect(support.isSupported).toBe(false);
        expect(support.isNameLike('vitalik.eth')).toBe(false);
    });

    it('reports no support without a symbol', () => {
        expect(getNamedAddressSupport(null).isSupported).toBe(false);
        expect(getNamedAddressSupport(undefined).isNameLike('vitalik.eth')).toBe(false);
    });
});
