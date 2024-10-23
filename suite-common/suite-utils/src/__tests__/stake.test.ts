import { getUnstakeAmountByEthereumDataHexFixtures } from '../__fixtures__/stake';
import { getUnstakeAmountByEthereumDataHex } from '../stake';

describe('getUnstakeAmountByEthereumDataHex', () => {
    getUnstakeAmountByEthereumDataHexFixtures.forEach(f => {
        it(f.description, () => {
            const result = getUnstakeAmountByEthereumDataHex(f.ethereumData);
            expect(result).toBe(f.expectedAmountWei);
        });
    });
});
