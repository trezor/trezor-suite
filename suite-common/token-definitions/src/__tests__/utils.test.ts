import {
    caseContractAddressForNetworkFixtures,
    getSupportedDefinitionTypesFixtures,
    isTokenDefinitionKnownFixtures,
} from '../__fixtures__/utils';
import {
    caseContractAddressForNetwork,
    getSupportedDefinitionTypes,
    isTokenDefinitionKnown,
} from '../utils';

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
