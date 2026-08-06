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
