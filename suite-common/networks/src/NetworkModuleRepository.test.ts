import { createNetworkModuleRepository } from './NetworkModuleRepository';
import { asNetworkSymbol } from './NetworkModules';
import { mockNetworkModule } from '../mocks/mockNetworkModule';

const customSymbol = asNetworkSymbol('evm4242');

const createRepository = () =>
    createNetworkModuleRepository({
        networkModules: [
            mockNetworkModule({ getSupportedNetworks: () => [asNetworkSymbol('eth')] }),
        ],
    });

const createCustomModule = () => mockNetworkModule({ getSupportedNetworks: () => [customSymbol] });

describe('network module repository runtime registration', () => {
    it('does not know a custom network until it is registered', () => {
        const repository = createRepository();

        expect(repository.isSupportedNetwork(customSymbol)).toBe(false);
        expect(() => repository.get(customSymbol)).toThrow('is not registered');
    });

    it('serves a registered module and lists its symbol', () => {
        const repository = createRepository();
        const supportedNetworks = repository.getSupportedNetworks();
        const networkModule = createCustomModule();

        repository.register(customSymbol, networkModule);

        expect(repository.get(customSymbol)).toBe(networkModule);
        expect(repository.isSupportedNetwork(customSymbol)).toBe(true);
        expect(repository.getSupportedNetworks()).toContain(customSymbol);
        // The list is kept current in place, so earlier references see the change.
        expect(supportedNetworks).toContain(customSymbol);
    });

    it('lists a re-registered symbol once and keeps the latest module', () => {
        const repository = createRepository();
        const latestModule = createCustomModule();

        repository.register(customSymbol, createCustomModule());
        repository.register(customSymbol, latestModule);

        expect(repository.get(customSymbol)).toBe(latestModule);
        expect(repository.getSupportedNetworks().filter(s => s === customSymbol)).toHaveLength(1);
    });

    it('forgets an unregistered module', () => {
        const repository = createRepository();

        repository.register(customSymbol, createCustomModule());
        repository.unregister(customSymbol);

        expect(repository.isSupportedNetwork(customSymbol)).toBe(false);
        expect(repository.getSupportedNetworks()).not.toContain(customSymbol);
        expect(() => repository.get(customSymbol)).toThrow('is not registered');
    });

    it('never lets a predefined network be replaced or removed', () => {
        const repository = createRepository();
        const ethSymbol = asNetworkSymbol('eth');
        const predefinedModule = repository.get(ethSymbol);

        expect(() => repository.register(ethSymbol, mockNetworkModule())).toThrow('is predefined');
        expect(() => repository.unregister(ethSymbol)).toThrow('is predefined');
        expect(repository.get(ethSymbol)).toBe(predefinedModule);
    });
});
