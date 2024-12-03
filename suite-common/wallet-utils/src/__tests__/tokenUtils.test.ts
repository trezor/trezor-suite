import { getContractAddressForNetworkSymbolFixtures } from '../__fixtures__/tokenUtils';
import { getContractAddressForNetworkSymbol } from '../tokenUtils';

describe('getContractAddressForNetworkSymbol', () => {
    getContractAddressForNetworkSymbolFixtures.forEach(
        ({ testName, networkSymbol, contractAddress, expected }) => {
            test(testName, () => {
                const result = getContractAddressForNetworkSymbol(networkSymbol, contractAddress);
                expect(result).toBe(expected);
            });
        },
    );
});
