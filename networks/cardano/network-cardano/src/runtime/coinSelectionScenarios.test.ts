import { coinSelection, trezorUtils } from '@fivebinaries/coin-selection';

import { smokeScenarios, witnesses } from './__fixtures__/coinSelectionParity.fixture';

// Runtime smoke test of the generated asm.js build (glue, memory, finalizers) on code paths the
// parity cases do not reach. Completeness of the kept exports is checked in generate.test.ts.
describe('coin selection scenarios', () => {
    it.each(smokeScenarios)('runs without an unexpected error: $name', scenario => {
        const run = () => {
            const result = coinSelection(scenario.params, scenario.options);
            if (result.type === 'final') {
                trezorUtils.signTransaction(result.tx.body, witnesses, { testnet: false });
            }

            return result;
        };

        if ('expectedErrorCode' in scenario) {
            expect(run).toThrow(expect.objectContaining({ code: scenario.expectedErrorCode }));

            return;
        }

        expect(run().type).toBe(scenario.expectedResultType);
    });
});
