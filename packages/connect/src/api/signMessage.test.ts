import type { SignMessage as SignMessageSchema } from '@trezor/connect-common';

import { default as SignMessageBase } from './signMessage';

class SignMessage extends SignMessageBase {
    getParams() {
        return this.params;
    }
}

// The method constructor is enough to exercise the script_type resolution: it derives
// proto.script_type from either the caller-supplied scriptType or, failing that, the path
// (getScriptType). getBitcoinNetwork reads statically-loaded coin data, so no device is needed.
const createMethodProto = (params: SignMessageSchema) =>
    new SignMessage({ payload: { method: 'signMessage', ...params } }).getParams().proto;

const base: SignMessageSchema = {
    path: "m/44'/0'/0'/0/0",
    coin: 'btc',
    message: 'This is an example of a signed message.',
};

describe('SignMessage script_type resolution', () => {
    it('derives script_type from the path when no scriptType is given', () => {
        // m/44' -> legacy, m/84' -> native segwit
        expect(createMethodProto({ ...base, path: "m/44'/0'/0'/0/0" }).script_type).toBe(
            'SPENDADDRESS',
        );
        expect(createMethodProto({ ...base, path: "m/84'/0'/0'/0/0" }).script_type).toBe(
            'SPENDWITNESS',
        );
    });

    it('prefers an explicit scriptType over the path-derived one', () => {
        // legacy path, but the caller overrides to native segwit
        expect(
            createMethodProto({ ...base, path: "m/44'/0'/0'/0/0", scriptType: 'SPENDWITNESS' })
                .script_type,
        ).toBe('SPENDWITNESS');
        expect(
            createMethodProto({ ...base, path: "m/44'/0'/0'/0/0", scriptType: 'SPENDTAPROOT' })
                .script_type,
        ).toBe('SPENDTAPROOT');
    });

    it("coerces SPENDMULTISIG to SPENDADDRESS (firmware rejects 'SPENDMULTISIG')", () => {
        expect(
            createMethodProto({ ...base, path: "m/44'/0'/0'/0/0", scriptType: 'SPENDMULTISIG' })
                .script_type,
        ).toBe('SPENDADDRESS');
    });

    it('rejects an unknown scriptType via schema validation', () => {
        expect(() =>
            createMethodProto({
                ...base,
                path: "m/44'/0'/0'/0/0",
                // @ts-expect-error
                scriptType: 'NOT_A_SCRIPT_TYPE',
            }),
        ).toThrow();
    });
});
