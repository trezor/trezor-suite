import { getContractAddressForNetworkFixtures } from '../__fixtures__/tokenUtils';
import { getContractAddressForNetwork } from '../tokenUtils';

describe('getContractAddressForNetwork', () => {
    getContractAddressForNetworkFixtures.forEach(
        ({ testName, networkSymbol, contractAddress, expected }) => {
            test(testName, () => {
                const result = getContractAddressForNetwork(networkSymbol, contractAddress);
                expect(result).toBe(expected);
            });
        },
    );
});
