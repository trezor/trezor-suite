import {
    caseContractAddressForNetworkFixtures,
    getSupportedDefinitionTypesFixtures,
    isTokenDefinitionKnownFixtures,
    buildTokenDefinitionsFromStorageFixtures,
} from '../__fixtures__/utils';
import {
    buildTokenDefinitionsFromStorage,
    caseContractAddressForNetwork,
    getSupportedDefinitionTypes,
    isTokenDefinitionKnown,
} from '../tokenDefinitionsUtils';

describe('caseContractAddressForNetwork', () => {
    caseContractAddressForNetworkFixtures.forEach(
        ({ testName, networkSymbol, contractAddress, expected }) => {
            test(testName, () => {
                const result = caseContractAddressForNetwork(networkSymbol, contractAddress);
                expect(result).toBe(expected);
            });
        },
    );
});

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
