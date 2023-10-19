import { networks } from '@trezor/utxo-lib';

import {
    getScriptPubKeyFromAddress,
    sortOutputs,
    mergePubkeys,
} from '../../src/utils/coordinatorUtils';

describe('coordinatorUtils', () => {
    it('getScriptPubKeyFromAddress', () => {
        expect(
            getScriptPubKeyFromAddress(
                'bcrt1qejqxwzfld7zr6mf7ygqy5s5se5xq7vmt8ntmj0',
                networks.regtest,
                'P2WPKH',
            ),
        ).toEqual('0 cc8067093f6f843d6d3e22004a4290cd0c0f336b');

        expect(
            getScriptPubKeyFromAddress(
                'bcrt1pn2d0yjeedavnkd8z8lhm566p0f2utm3lgvxrsdehnl94y34txmtsef5dqz',
                networks.regtest,
                'Taproot',
            ),
        ).toEqual('1 9a9af24b396f593b34e23fefba6b417a55c5ee3f430c3837379fcb5246ab36d7');

        expect(
            getScriptPubKeyFromAddress(
                'tb1paxhjl357yzctuf3fe58fcdx6nul026hhh6kyldpfsf3tckj9a3wslqd7zd',
                networks.testnet,
                'Taproot',
            ),
        ).toEqual('1 e9af2fc69e20b0be2629cd0e9c34da9f3ef56af7beac4fb4298262bc5a45ec5d');
        expect(
            getScriptPubKeyFromAddress(
                'tb1qkvwu9g3k2pdxewfqr7syz89r3gj557l3uuf9r9',
                networks.testnet,
                'P2WPKH',
            ),
        ).toEqual('0 b31dc2a236505a6cb9201fa0411ca38a254a7bf1');

        expect(
            getScriptPubKeyFromAddress(
                'bc1qkkr2uvry034tsj4p52za2pg42ug4pxg5qfxyfa',
                networks.bitcoin,
                'P2WPKH',
            ),
        ).toEqual('0 b586ae30647c6ab84aa1a285d505155711509914');
        expect(
            getScriptPubKeyFromAddress(
                'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr',
                networks.bitcoin,
                'Taproot',
            ),
        ).toEqual('1 a60869f0dbcf1dc659c9cecbaf8050135ea9e8cdc487053f1dc6880949dc684c');

        // invalid combinations
        expect(() =>
            getScriptPubKeyFromAddress(
                'bc1qkkr2uvry034tsj4p52za2pg42ug4pxg5qfxyfa',
                networks.testnet, // invalid network
                'P2WPKH',
            ),
        ).toThrow(/Network mismatch/);
        expect(() =>
            getScriptPubKeyFromAddress(
                'bc1qkkr2uvry034tsj4p52za2pg42ug4pxg5qfxyfa',
                networks.bitcoin,
                'Taproot', // invalid scriptType
            ),
        ).toThrow(/Invalid checksum/);
        expect(() =>
            getScriptPubKeyFromAddress(
                '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX',
                networks.bitcoin,
                // @ts-expect-error
                'P2SH', // unknown scriptType
            ),
        ).toThrow(/Unsupported scriptType/);
    });

    it('sortOutputs', () => {
        // sorting by amount
        expect(
            [
                { ScriptPubKey: '0', Value: 2 },
                { ScriptPubKey: '1', Value: 1 },
            ].sort(sortOutputs),
        ).toEqual([
            { ScriptPubKey: '0', Value: 2 },
            { ScriptPubKey: '1', Value: 1 },
        ]);
        // sorting by scriptPubKey
        expect(
            [
                { ScriptPubKey: '0 10', Value: 1 },
                { ScriptPubKey: '0 10', Value: 1 },
                { ScriptPubKey: '0 00', Value: 1 },
                { ScriptPubKey: '1 12', Value: 1 },
                { ScriptPubKey: '1 11', Value: 1 },
            ].sort(sortOutputs),
        ).toEqual([
            { ScriptPubKey: '0 00', Value: 1 },
            { ScriptPubKey: '0 10', Value: 1 },
            { ScriptPubKey: '0 10', Value: 1 },
            { ScriptPubKey: '1 11', Value: 1 },
            { ScriptPubKey: '1 12', Value: 1 },
        ]);
    });

    it('mergePubkeys', () => {
        expect(
            mergePubkeys([
                { Type: 'OutputAdded', Output: { ScriptPubKey: '01', Value: 1 } },
                { Type: 'OutputAdded', Output: { ScriptPubKey: '02', Value: 1 } },
                { Type: 'OutputAdded', Output: { ScriptPubKey: '03', Value: 1 } },
            ]),
        ).toEqual([
            { Type: 'OutputAdded', Output: { ScriptPubKey: '01', Value: 1 } },
            { Type: 'OutputAdded', Output: { ScriptPubKey: '02', Value: 1 } },
            { Type: 'OutputAdded', Output: { ScriptPubKey: '03', Value: 1 } },
        ]);

        expect(
            mergePubkeys([
                { Type: 'OutputAdded', Output: { ScriptPubKey: '01', Value: 1 } },
                { Type: 'OutputAdded', Output: { ScriptPubKey: '01', Value: 1 } },
                { Type: 'OutputAdded', Output: { ScriptPubKey: '02', Value: 1 } },
                { Type: 'OutputAdded', Output: { ScriptPubKey: '01', Value: 1 } },
            ]),
        ).toEqual([
            { Type: 'OutputAdded', Output: { ScriptPubKey: '01', Value: 3 } },
            { Type: 'OutputAdded', Output: { ScriptPubKey: '02', Value: 1 } },
        ]);
    });
});
