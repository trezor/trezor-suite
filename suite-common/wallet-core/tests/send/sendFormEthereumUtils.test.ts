import * as fixtures from './sendFormEthereumUtils.fixtures';
import { calculateEvmTxWithFees } from '../../src/send/sendFormEthereumUtils';

describe(calculateEvmTxWithFees.name, () => {
    fixtures.calculateEvmTxWithFees.forEach(f => {
        it(`${f.description}`, () => {
            const result = calculateEvmTxWithFees(f.input);

            expect(result).toEqual(f.result);
        });
    });
});
