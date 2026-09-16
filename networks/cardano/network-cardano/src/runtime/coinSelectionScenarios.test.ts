import { coinSelection, trezorUtils } from '@fivebinaries/coin-selection';

import { smokeScenarios, witnesses } from './__fixtures__/coinSelectionParity.fixture';

// Runs under the default Jest config (WASM build) and under jest.config.asmjs.cjs (generated
// asm.js build). A missing function in the generated build surfaces here as an unexpected error.
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
