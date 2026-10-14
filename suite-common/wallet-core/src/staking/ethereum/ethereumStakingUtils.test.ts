import { getUnstakeAmountByEthereumDataHexFixtures } from './__fixtures__/ethereumStakingUtils';
import { getUnstakeAmountByEthereumDataHex } from './ethereumStakingUtils';

describe('getUnstakeAmountByEthereumDataHex', () => {
    getUnstakeAmountByEthereumDataHexFixtures.forEach(f => {
        it(f.description, () => {
            const result = getUnstakeAmountByEthereumDataHex(f.transactionData);
            expect(result).toBe(f.expectedAmountWei);
        });
    });
});
