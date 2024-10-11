import {
    getSupportedDefinitionTypesFixtures,
    isTokenDefinitionKnownFixtures,
    buildTokenDefinitionsFromStorageFixtures,
} from '../__fixtures__/utils';
import {
    buildTokenDefinitionsFromStorage,
    getSupportedDefinitionTypes,
    isTokenDefinitionKnown,
} from '../tokenDefinitionsUtils';

describe('isTokenDefinitionKnown', () => {
    isTokenDefinitionKnownFixtures.forEach(
        ({ testName, tokenDefinitions, networkSymbol, contractAddress, result }) => {
            test(testName, () => {
                expect(
                    isTokenDefinitionKnown(tokenDefinitions, networkSymbol, contractAddress),
                ).toBe(result);
            });
        },
    );
});

describe('getSupportedDefinitionTypes', () => {
    getSupportedDefinitionTypesFixtures.forEach(({ testName, networkSymbol, result }) => {
        test(testName, () => {
            expect(getSupportedDefinitionTypes(networkSymbol)).toEqual(result);
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
