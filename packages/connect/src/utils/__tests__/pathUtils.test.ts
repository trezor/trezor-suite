import { getHDPath, getScriptType, getOutputScriptType, getAccountType } from '../pathUtils';

describe('utils/pathUtils', () => {
    it('getScriptType', () => {
        expect(getScriptType(getHDPath("m/44'/1'/0'"))).toEqual('SPENDADDRESS');
        expect(getScriptType(getHDPath("m/49'/1'/0'"))).toEqual('SPENDP2SHWITNESS');
        expect(getScriptType(getHDPath("m/84'/1'/0'"))).toEqual('SPENDWITNESS');
        expect(getScriptType(getHDPath("m/86'/1'/0'"))).toEqual('SPENDTAPROOT');
        expect(getScriptType(getHDPath("m/10025'/1'/0'/1'"))).toEqual('SPENDTAPROOT'); // slip-25
        // bip48
        expect(getScriptType(getHDPath("m/48'/1'/0'"))).toEqual(undefined); // not bip48 path SPENDADDRESS will be used
        expect(getScriptType(getHDPath("m/48'/1'/0'/0'"))).toEqual('SPENDMULTISIG');
        expect(getScriptType(getHDPath("m/48'/1'/0'/1'"))).toEqual('SPENDP2SHWITNESS');
        expect(getScriptType(getHDPath("m/48'/1'/0'/2'"))).toEqual('SPENDWITNESS');

        // defaults
        expect(getScriptType([])).toEqual(undefined);
        expect(getScriptType([0])).toEqual(undefined);
    });

    it('getOutputScriptType', () => {
        expect(getOutputScriptType(getHDPath("m/44'/1'/0'"))).toEqual('PAYTOADDRESS');
        expect(getOutputScriptType(getHDPath("m/49'/1'/0'"))).toEqual('PAYTOP2SHWITNESS');
        expect(getOutputScriptType(getHDPath("m/84'/1'/0'"))).toEqual('PAYTOWITNESS');
        expect(getOutputScriptType(getHDPath("m/86'/1'/0'"))).toEqual('PAYTOTAPROOT');
        expect(getOutputScriptType(getHDPath("m/10025'/1'/0'/1'"))).toEqual('PAYTOTAPROOT'); // slip-25
        // bip48
        expect(getOutputScriptType(getHDPath("m/48'/1'/0'"))).toEqual(undefined); // not bip48 path SPENDADDRESS will be used
        expect(getOutputScriptType(getHDPath("m/48'/1'/0'/0'"))).toEqual('PAYTOMULTISIG');
        expect(getOutputScriptType(getHDPath("m/48'/1'/0'/1'"))).toEqual('PAYTOP2SHWITNESS');
        expect(getOutputScriptType(getHDPath("m/48'/1'/0'/2'"))).toEqual('PAYTOWITNESS');

        // compatibility for Casa - allow an unhardened 49 path to use PAYTOP2SHWITNESS
        expect(getOutputScriptType(getHDPath("m/49/1'/0'"))).toEqual('PAYTOP2SHWITNESS');
        // defaults
        expect(getOutputScriptType([])).toEqual(undefined);
        expect(getOutputScriptType([0])).toEqual(undefined);
    });

    it('getAccountType', () => {
        expect(getAccountType(getHDPath("m/44'/1'/0'"))).toEqual('p2pkh');
        expect(getAccountType(getHDPath("m/48'/1'/0'"))).toEqual('p2pkh'); // NOTE: missing "multisig" account type
        expect(getAccountType(getHDPath("m/49'/1'/0'"))).toEqual('p2sh');
        expect(getAccountType(getHDPath("m/84'/1'/0'"))).toEqual('p2wpkh');
        expect(getAccountType(getHDPath("m/86'/1'/0'"))).toEqual('p2tr');
        expect(getAccountType(getHDPath("m/10025'/1'/0'/1'"))).toEqual('p2tr'); // NOTE: slip25 should be p2tr type

        // defaults
        expect(getAccountType([])).toEqual('p2pkh');
        expect(getAccountType([0])).toEqual('p2pkh');
        expect(getAccountType(undefined)).toEqual('p2pkh');
    });
});
