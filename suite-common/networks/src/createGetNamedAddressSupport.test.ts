import { createMockDeps } from '@suite-common/dependency-injection';

import { type NetworkSymbol } from './NetworkModules';
import {
    type GetNamedAddressSupportDeps,
    type SymbolNamedAddressResolver,
    createGetNamedAddressSupport,
} from './createGetNamedAddressSupport';
import { mockNetworkModule } from '../mocks/mockNetworkModule';

const createDeps = (resolver?: SymbolNamedAddressResolver) =>
    createMockDeps<GetNamedAddressSupportDeps>({
        networkModuleRepository: {
            get: <TSymbol extends NetworkSymbol>() =>
                mockNetworkModule<TSymbol>({ namedAddressResolver: resolver }),
            getSupportedNetworks: null,
            isSupportedNetwork: null,
        },
    });

const createResolver = () =>
    createMockDeps<SymbolNamedAddressResolver>({
        supportsNamedAddress: null,
        isNameLike: null,
        isAddressLike: null,
        resolveNamedAddress: null,
        reverseResolveAddress: null,
    });

describe('createGetNamedAddressSupport', () => {
    it('returns the resolver when it supports the requested network', () => {
        const resolver = createResolver();
        resolver.supportsNamedAddress.mockReturnValue(true);
        resolver.isNameLike.mockReturnValue(true);
        const deps = createDeps(resolver);

        const support = createGetNamedAddressSupport(deps)('eth');

        expect(support).toEqual({ isSupported: true, resolver, isNameLike: expect.any(Function) });
        expect(support.isNameLike('alice.eth')).toBe(true);
        expect(deps.networkModuleRepository.get).toHaveBeenCalledWith('eth');
        expect(resolver.supportsNamedAddress).toHaveBeenCalledWith('eth');
        expect(resolver.isNameLike).toHaveBeenCalledWith('alice.eth');
    });

    it('recognizes names even when the resolver does not support the network', () => {
        const resolver = createResolver();
        resolver.supportsNamedAddress.mockReturnValue(false);
        resolver.isNameLike.mockReturnValue(true);
        const deps = createDeps(resolver);

        const support = createGetNamedAddressSupport(deps)('base');

        expect(support.isSupported).toBe(false);
        expect(support.isNameLike('alice.eth')).toBe(true);
        expect(resolver.supportsNamedAddress).toHaveBeenCalledWith('base');
    });

    it('recognizes no names when the module has no resolver', () => {
        const deps = createDeps();

        const support = createGetNamedAddressSupport(deps)('btc');

        expect(support.isSupported).toBe(false);
        expect(support.isNameLike('alice.eth')).toBe(false);
    });

    it.each([null, undefined])('does not look up a module without a symbol (%s)', symbol => {
        const deps = createDeps();

        const support = createGetNamedAddressSupport(deps)(symbol);

        expect(support.isSupported).toBe(false);
        expect(support.isNameLike('alice.eth')).toBe(false);
        expect(deps.networkModuleRepository.get).not.toHaveBeenCalled();
    });
});
