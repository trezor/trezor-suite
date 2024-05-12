import { transformTxFixtures } from '../__fixtures__/stake';
import { transformTx } from '../stake';

describe('transformTx', () => {
    transformTxFixtures.forEach(test => {
        it(test.description, () => {
            const result = transformTx(test.tx, test.gasPrice, test.nonce, test.chainId);
            expect(result).toEqual(test.result);
            expect(result).not.toHaveProperty('from');
        });
    });
});
