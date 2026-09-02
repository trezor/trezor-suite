import * as fixtures from './__fixtures__/sendFormEthereumThunks.fixtures';
import { calculate } from './sendFormEthereumThunks';

describe(calculate.name, () => {
    fixtures.calculate.forEach(f => {
        it(`${f.description}`, () => {
            const result = calculate(
                f.input.availableBalance,
                f.input.output,
                f.input.feeLevel,
                f.input.token,
            );

            expect(result).toEqual(f.result);
        });
    });
});
