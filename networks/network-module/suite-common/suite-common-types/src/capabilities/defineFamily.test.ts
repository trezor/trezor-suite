import { asNetworkSymbol } from '@trezor/network-module-types';

import { defineCapability, defineFamily } from './defineFamily';
import { defineMessageSigning } from './messageSigning/defineMessageSigning';
import { mockSuiteCommonNetworkConfig } from '../../mocks';

type TestFamilyDeps = { getHistoryUrl: () => string };

// A capability the app has no contract for, standing in for anything that depends on the backend.
const txHistory = defineCapability({
    requires: { backends: ['blockbook'] },
    create: (deps: TestFamilyDeps, network) => ({
        getUrl: () => `${deps.getHistoryUrl()}/${network.symbol}`,
    }),
});

const messageSigning = defineCapability({
    requires: { feature: 'sign-verify' },
    create: (_deps: TestFamilyDeps) =>
        defineMessageSigning({
            labels: { title: { id: 'TR_SIGN_MESSAGE', defaultMessage: 'Sign message' } },
            addressSelection: 'fixed',
            outputs: ['signature'],
            toAccount: account => account,
            getSignAddressGroups: () => [],
            sign: () => Promise.resolve({ success: true, payload: { signature: 'sig' } }),
        }),
});

const testFamily = defineFamily<TestFamilyDeps>()({
    family: 'test',
    symbols: ['aaa', 'taaa'] as const,
    getConfig: symbol =>
        mockSuiteCommonNetworkConfig({
            name: symbol,
            features: ['sign-verify'],
            accountTypes: {
                taproot: { accountType: 'taproot', bip43Path: "m/86'/0'/i'", features: [] },
            },
        }),
    capabilities: { messageSigning, txHistory },
});

const deps: TestFamilyDeps = { getHistoryUrl: () => 'https://history' };

describe('defineFamily', () => {
    it('creates a network for the context with its config', () => {
        const network = testFamily.createNetwork(deps, { symbol: 'aaa', backend: 'blockbook' });

        expect(network.family).toBe('test');
        expect(network.symbol).toBe('aaa');
        expect(network.config.name).toBe('aaa');
        expect(network.capabilities.txHistory?.getUrl()).toBe('https://history/aaa');
    });

    it('resolves different capabilities for the same symbol on different backends', () => {
        const onBlockbook = testFamily.createNetwork(deps, { symbol: 'aaa', backend: 'blockbook' });
        const onRpc = testFamily.createNetwork(deps, { symbol: 'aaa', backend: 'evm-rpc' });

        expect(onBlockbook.capabilities.txHistory).toBeDefined();
        expect(onRpc.capabilities.txHistory).toBeUndefined();
        expect(onRpc.capabilities.messageSigning).toBeDefined();
    });

    it('drops a capability the account type does not support', () => {
        const network = testFamily.createNetwork(deps, {
            symbol: 'aaa',
            backend: 'blockbook',
            accountType: 'taproot',
        });

        expect(network.capabilities.messageSigning).toBeUndefined();
    });

    it('resolves only its own symbols once bound', () => {
        const family = testFamily.bind(deps);

        expect(family.isSupportedNetwork('taaa')).toBe(true);
        expect(
            family.resolveNetwork({ symbol: asNetworkSymbol('zzz'), backend: 'blockbook' }),
        ).toBeUndefined();
        expect(
            family.resolveNetwork({ symbol: asNetworkSymbol('taaa'), backend: 'blockbook' })
                ?.capabilities.messageSigning,
        ).toBeDefined();
    });
});
