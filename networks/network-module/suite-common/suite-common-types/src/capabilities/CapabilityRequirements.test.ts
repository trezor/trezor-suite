import { asNetworkSymbol } from '@trezor/network-module-types';

import { areRequirementsMet, getContextFeatures } from './CapabilityRequirements';
import type { NetworkContext } from './NetworkContext';
import { mockSuiteCommonNetworkConfig } from '../../mocks';

const config = mockSuiteCommonNetworkConfig({
    features: ['sign-verify', 'rbf'],
    accountTypes: {
        taproot: { accountType: 'taproot', bip43Path: "m/86'/0'/i'", features: ['rbf'] },
        segwit: { accountType: 'segwit', bip43Path: "m/49'/0'/i'" },
    },
});

const context: NetworkContext = { symbol: asNetworkSymbol('aaa'), backend: 'blockbook' };

describe('getContextFeatures', () => {
    it('uses the network features when the account type has none of its own', () => {
        expect(getContextFeatures(config, undefined)).toEqual(['sign-verify', 'rbf']);
        expect(getContextFeatures(config, 'segwit')).toEqual(['sign-verify', 'rbf']);
        expect(getContextFeatures(config, 'normal')).toEqual(['sign-verify', 'rbf']);
    });

    it('replaces the network features with the account type features', () => {
        expect(getContextFeatures(config, 'taproot')).toEqual(['rbf']);
    });
});

describe('areRequirementsMet', () => {
    it('accepts a capability without requirements', () => {
        expect(areRequirementsMet({ requirements: {}, config, context })).toBe(true);
    });

    it('reads the feature for the account type of the context', () => {
        const requirements = { feature: 'sign-verify' } as const;

        expect(areRequirementsMet({ requirements, config, context })).toBe(true);
        expect(
            areRequirementsMet({
                requirements,
                config,
                context: { ...context, accountType: 'taproot' },
            }),
        ).toBe(false);
    });

    it('limits a capability to the listed backends', () => {
        const requirements = { backends: ['blockbook'] } as const;

        expect(areRequirementsMet({ requirements, config, context })).toBe(true);
        expect(
            areRequirementsMet({
                requirements,
                config,
                context: { ...context, backend: 'evm-rpc' },
            }),
        ).toBe(false);
    });

    it('requires a known version at least as new as the minimum', () => {
        const requirements = { minVersion: '2.0.0' };

        expect(
            areRequirementsMet({ requirements, config, context: { ...context, version: '2.1.0' } }),
        ).toBe(true);
        expect(
            areRequirementsMet({ requirements, config, context: { ...context, version: '1.9.9' } }),
        ).toBe(false);
        expect(areRequirementsMet({ requirements, config, context })).toBe(false);
        expect(
            areRequirementsMet({ requirements, config, context: { ...context, version: 'beta' } }),
        ).toBe(false);
    });
});
