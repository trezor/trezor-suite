import * as fixtures from './buildAllowanceTransaction.fixtures';
import { buildAllowanceTransaction } from '../../src/allowance/buildAllowanceTransaction';

describe(buildAllowanceTransaction.name, () => {
    fixtures.buildAllowanceTransaction.forEach(f => {
        it(f.description, () => {
            const result = buildAllowanceTransaction(
                f.input.balance,
                f.input.contract,
                f.input.feeLevel,
                f.input.networkDisplaySymbol,
                f.input.token,
                f.input.estimatedFeeLimit,
            );

            expect(result).toEqual(f.result);
        });
    });
});
