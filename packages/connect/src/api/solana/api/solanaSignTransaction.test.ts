import SolanaSignTransaction from './solanaSignTransaction';

// Regression test for a confidential-data → Sentry leak: payloadToPrecomposed
// caught any error from decoding the (attacker/dApp-supplied, unvalidated-as-hex)
// serialized transaction and logged the RAW error via console.error. The base16
// decoder throws "Invalid value <serializedTx> for base 16 ..." — embedding the
// full serialized transaction (addresses/amounts) — which reaches Sentry via
// captureConsoleIntegration in the popup/renderer. The fix logs a static string.
describe('solanaSignTransaction payloadToPrecomposed', () => {
    const CONFIDENTIAL = 'SECRET-DESTINATION-ADDRESS-AND-AMOUNT';

    const buildMethod = (serializedTx: string) =>
        new SolanaSignTransaction({
            id: 1,
            // minimal payload that passes Assert(SolanaSignTransactionSchema)
            payload: {
                method: 'solanaSignTransaction',
                path: "m/44'/501'/0'/0'",
                serializedTx,
            },
        } as any);

    it('does not log the raw serialized transaction when decoding throws', async () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // non-hex serializedTx → base16 decoder throws with the value embedded
        const method = buildMethod(CONFIDENTIAL);
        const result = await method.payloadToPrecomposed();

        // method never throws; returns undefined on failure
        expect(result).toBeUndefined();

        // it still logs (diagnostic), but never with the confidential value
        expect(spy).toHaveBeenCalled();
        const loggedArgs = spy.mock.calls.flat();
        const serialized = loggedArgs
            .map(arg => (arg instanceof Error ? `${arg.message}\n${arg.stack ?? ''}` : String(arg)))
            .join('\n');
        expect(serialized).not.toContain(CONFIDENTIAL);

        spy.mockRestore();
    });
});
