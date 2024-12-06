import { getContractAddressForNetworkSymbolFixtures } from '../__fixtures__/tokenUtils';
import { getContractAddressForNetworkSymbol } from '../tokenUtils';

describe('getContractAddressForNetworkSymbol', () => {
    getContractAddressForNetworkSymbolFixtures.forEach(
        ({ testName, symbol, contractAddress, expected }) => {
            test(testName, () => {
                const result = getContractAddressForNetworkSymbol(symbol, contractAddress);
                expect(result).toBe(expected);
            });
        },
    );
});
