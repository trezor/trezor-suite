import SignMessage from './signMessage';

// The method constructor is enough to exercise the script_type resolution: it derives
// proto.script_type from either the caller-supplied scriptType or, failing that, the path
// (getScriptType). getBitcoinNetwork reads statically-loaded coin data, so no device is needed.
const buildProto = (params: Record<string, unknown>) =>
    (new SignMessage({ payload: { method: 'signMessage', ...params } } as any) as any).params.proto;

const base = { coin: 'btc', message: 'This is an example of a signed message.' };

describe('SignMessage script_type resolution', () => {
    it('derives script_type from the path when no scriptType is given', () => {
        // m/44' -> legacy, m/84' -> native segwit
        expect(buildProto({ ...base, path: "m/44'/0'/0'/0/0" }).script_type).toBe('SPENDADDRESS');
        expect(buildProto({ ...base, path: "m/84'/0'/0'/0/0" }).script_type).toBe('SPENDWITNESS');
    });

    it('prefers an explicit scriptType over the path-derived one', () => {
        // legacy path, but the caller overrides to native segwit
        expect(
            buildProto({ ...base, path: "m/44'/0'/0'/0/0", scriptType: 'SPENDWITNESS' })
                .script_type,
        ).toBe('SPENDWITNESS');
        expect(
            buildProto({ ...base, path: "m/44'/0'/0'/0/0", scriptType: 'SPENDTAPROOT' })
                .script_type,
        ).toBe('SPENDTAPROOT');
    });

    it("coerces SPENDMULTISIG to SPENDADDRESS (firmware rejects 'SPENDMULTISIG')", () => {
        expect(
            buildProto({ ...base, path: "m/44'/0'/0'/0/0", scriptType: 'SPENDMULTISIG' })
                .script_type,
        ).toBe('SPENDADDRESS');
    });

    it('rejects an unknown scriptType via schema validation', () => {
        expect(() =>
            buildProto({ ...base, path: "m/44'/0'/0'/0/0", scriptType: 'NOT_A_SCRIPT_TYPE' }),
        ).toThrow();
    });
});
