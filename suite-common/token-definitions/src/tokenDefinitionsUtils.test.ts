import { asNetworkSymbol } from '@suite-common/wallet-config';

import {
    buildTokenDefinitionsFromStorageFixtures,
    getSupportedDefinitionTypesFixtures,
    isTokenDefinitionKnownFixtures,
} from './__fixtures__/utils';
import {
    buildTokenDefinitionsFromStorage,
    getSupportedDefinitionTypes,
    isTokenDefinitionKnown,
    sanitizeTokenDefinitions,
} from './tokenDefinitionsUtils';

describe('isTokenDefinitionKnown', () => {
    isTokenDefinitionKnownFixtures.forEach(
        ({ testName, tokenDefinitions, symbol, contractAddress, result }) => {
            test(testName, () => {
                expect(
                    isTokenDefinitionKnown(
                        tokenDefinitions,
                        asNetworkSymbol(symbol),
                        contractAddress,
                    ),
                ).toBe(result);
            });
        },
    );
});

describe('getSupportedDefinitionTypes', () => {
    getSupportedDefinitionTypesFixtures.forEach(({ testName, symbol, result }) => {
        test(testName, () => {
            expect(getSupportedDefinitionTypes(asNetworkSymbol(symbol))).toEqual(result);
        });
    });
});

describe('buildTokenDefinitionsFromStorage', () => {
    buildTokenDefinitionsFromStorageFixtures.forEach(({ testName, storage, result }) => {
        test(testName, () => {
            expect(buildTokenDefinitionsFromStorage(storage)).toEqual(result);
        });
    });
});

describe('sanitizeTokenDefinitions', () => {
    test('passes a valid string[] through unchanged', () => {
        const data = ['0xabc', 'ISSUER-code', '0xdef'];

        expect(sanitizeTokenDefinitions(data)).toEqual(data);
    });

    test('drops non-string entries so downstream string derefs cannot throw', () => {
        // A poison array from the unsigned CDN would crash e.g. `contract.split('-')` in
        // useInactiveStellarTokens; the non-string entries must be filtered out.
        const result = sanitizeTokenDefinitions(['0xabc', 123, null, undefined, {}, '0xdef']);

        expect(result).toEqual(['0xabc', '0xdef']);
        expect(() => result.map(contract => contract.split('-')[0])).not.toThrow();
    });

    test('returns [] for a non-array payload (e.g. object / number / string / null)', () => {
        expect(sanitizeTokenDefinitions({})).toEqual([]);
        expect(sanitizeTokenDefinitions(42)).toEqual([]);
        expect(sanitizeTokenDefinitions('0xabc')).toEqual([]);
        expect(sanitizeTokenDefinitions(null)).toEqual([]);
        expect(sanitizeTokenDefinitions(undefined)).toEqual([]);
    });
});
