import type {
    BundledParams,
    GetAccountInfo as GetAccountInfoParams,
    Params,
} from '@trezor/connect-common';

import GetAccountInfo from './getAccountInfo';

const createMethod = (params: Params<GetAccountInfoParams> | BundledParams<GetAccountInfoParams>) =>
    new GetAccountInfo({ payload: { method: 'getAccountInfo', ...params } });

describe('GetAccountInfo path and coin', () => {
    it.each<GetAccountInfoParams>([
        { coin: 'btc', path: "m/84'/0'/0'" },
        { coin: 'test', path: "m/84'/1'/0'" },
        { coin: 'eth', path: "m/44'/60'/0'/0/0" },
        { coin: 'etc', path: "m/44'/61'/0'/0/0" },
        { coin: 'tsep', path: "m/44'/1'/0'/0/0" },
        { coin: 'txrp', path: "m/44'/144'/0'/0/0" },
    ])('accepts $coin with path $path', params => {
        expect(createMethod(params).requiredPermissions).toEqual([
            { permission: 'read_account_info', coin: params.coin },
        ]);
    });

    it.each<GetAccountInfoParams>([
        { coin: 'btc', path: "m/44'/60'/0'" },
        { coin: 'test', path: "m/84'/0'/0'" },
        { coin: 'eth', path: "m/44'/61'/0'/0/0" },
    ])('rejects $coin with path $path of another coin', params => {
        expect(() => createMethod(params)).toThrow('Parameters "path" and "coin" do not match.');
    });

    it('rejects a bundle in which one path is of another coin', () => {
        expect(() =>
            createMethod({
                bundle: [
                    { coin: 'btc', path: "m/84'/0'/0'" },
                    { coin: 'btc', path: "m/44'/195'/0'" },
                ],
            }),
        ).toThrow('Parameters "path" and "coin" do not match.');
    });
});
