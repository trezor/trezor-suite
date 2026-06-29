import * as fixtures from './sendFormEthereumThunks.fixtures';
import { calculate } from '../../src/send/sendFormEthereumThunks';

describe(calculate.name, () => {
    fixtures.calculate.forEach(f => {
        it(`${f.description}`, () => {
            const result = calculate(
                f.input.availableBalance,
                f.input.output,
                f.input.feeLevel,
                f.input.token,
                undefined,
                false,
                'tokenId' in f.input ? f.input.tokenId : undefined,
            );

            expect(result).toEqual(f.result);
        });
    });
});
