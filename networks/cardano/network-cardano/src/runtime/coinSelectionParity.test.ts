import { coinSelection, trezorUtils } from '@fivebinaries/coin-selection';
import { createHash } from 'crypto';

import { parityCases, witnesses } from './__fixtures__/coinSelectionParity.fixture';

// The expected values were produced by the WASM build of Cardano Serialization Lib. The same
// test runs against the asm.js build used by the mobile app (see jest.config.asmjs.cjs), which
// guarantees both platforms compose byte-identical transactions from identical inputs.
// Set by jest.config.asmjs.cjs; undefined under the default config, which uses the WASM build.
declare const CARDANO_SERIALIZATION_LIB_BUILD: string | undefined;

describe('coin selection parity across Cardano Serialization Lib builds', () => {
    it('runs against the Cardano Serialization Lib build selected by the Jest config', () => {
        const expectedBuild =
            typeof CARDANO_SERIALIZATION_LIB_BUILD === 'undefined'
                ? 'nodejs'
                : CARDANO_SERIALIZATION_LIB_BUILD;

        expect(require.resolve('@emurgo/cardano-serialization-lib-nodejs')).toContain(
            `cardano-serialization-lib-${expectedBuild}`,
        );
    });

    it.each(Object.entries(parityCases))(
        'composes and serializes the expected transaction: %s',
        (_name, { params, options, expected }) => {
            const result = coinSelection(params, options);

            expect(result.type).toBe('final');
            if (result.type !== 'final') return;

            expect(result.fee).toBe(expected.fee);
            expect(result.totalSpent).toBe(expected.totalSpent);
            expect(result.tx.hash).toBe(expected.hash);
            expect(result.tx.size).toBe(expected.size);

            const serializedTx = trezorUtils.signTransaction(result.tx.body, witnesses, {
                testnet: false,
            });
            const serializedTxHash = createHash('sha256').update(serializedTx, 'hex').digest('hex');

            expect(serializedTxHash).toBe(expected.serializedTxHash);
        },
    );
});
