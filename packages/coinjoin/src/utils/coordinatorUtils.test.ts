import { networks } from '@trezor/utxo-lib';

import {
    getAddressFromScriptPubKey,
    getScriptPubKeyFromAddress,
    mergePubkeys,
    prefixScriptPubKey,
    sortOutputs,
} from './coordinatorUtils';

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

    it('prefixScriptPubKey', () => {
        // segwit outputs are printed with a bare witness version
        expect(prefixScriptPubKey('0 b586ae30647c6ab84aa1a285d505155711509914')).toEqual(
            '0014b586ae30647c6ab84aa1a285d505155711509914',
        );
        expect(
            prefixScriptPubKey(
                '0 a60869f0dbcf1dc659c9cecbaf8050135ea9e8cdc487053f1dc6880949dc684c',
            ),
        ).toEqual('0020a60869f0dbcf1dc659c9cecbaf8050135ea9e8cdc487053f1dc6880949dc684c');
        expect(
            prefixScriptPubKey(
                '1 a60869f0dbcf1dc659c9cecbaf8050135ea9e8cdc487053f1dc6880949dc684c',
            ),
        ).toEqual('5120a60869f0dbcf1dc659c9cecbaf8050135ea9e8cdc487053f1dc6880949dc684c');
        // P2PKH and P2SH outputs are printed with named opcodes
        expect(
            prefixScriptPubKey(
                'OP_DUP OP_HASH160 751e76e8199196d454941c45d1b3a323f1433bd6 OP_EQUALVERIFY OP_CHECKSIG',
            ),
        ).toEqual('76a914751e76e8199196d454941c45d1b3a323f1433bd688ac');
        expect(
            prefixScriptPubKey('OP_HASH160 b472a266d0bd89c13706a4132ccfb16f7c3b9fcb OP_EQUAL'),
        ).toEqual('a914b472a266d0bd89c13706a4132ccfb16f7c3b9fcb87');
    });

    it('getAddressFromScriptPubKey', () => {
        expect(
            getAddressFromScriptPubKey(
                '0 b586ae30647c6ab84aa1a285d505155711509914',
                networks.bitcoin,
            ),
        ).toEqual('bc1qkkr2uvry034tsj4p52za2pg42ug4pxg5qfxyfa');
        expect(
            getAddressFromScriptPubKey(
                '0 a60869f0dbcf1dc659c9cecbaf8050135ea9e8cdc487053f1dc6880949dc684c',
                networks.bitcoin,
            ),
        ).toEqual('bc1q5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxquwd2ql');
        expect(
            getAddressFromScriptPubKey(
                '1 a60869f0dbcf1dc659c9cecbaf8050135ea9e8cdc487053f1dc6880949dc684c',
                networks.bitcoin,
            ),
        ).toEqual('bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr');
        expect(
            getAddressFromScriptPubKey(
                'OP_DUP OP_HASH160 751e76e8199196d454941c45d1b3a323f1433bd6 OP_EQUALVERIFY OP_CHECKSIG',
                networks.bitcoin,
            ),
        ).toEqual('1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH');
        expect(
            getAddressFromScriptPubKey(
                'OP_HASH160 b472a266d0bd89c13706a4132ccfb16f7c3b9fcb OP_EQUAL',
                networks.bitcoin,
            ),
        ).toEqual('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy');
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
        // sorting by script bytes: P2WPKH (0014...) before P2WSH (0020...)
        expect(
            [
                { ScriptPubKey: `0 ${'00'.repeat(32)}`, Value: 1 },
                { ScriptPubKey: `0 ${'ff'.repeat(20)}`, Value: 1 },
            ].sort(sortOutputs),
        ).toEqual([
            { ScriptPubKey: `0 ${'ff'.repeat(20)}`, Value: 1 },
            { ScriptPubKey: `0 ${'00'.repeat(32)}`, Value: 1 },
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
