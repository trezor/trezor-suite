import { default as GetAccountInfo } from './getAccountInfo';

const DESCRIPTOR = 'GBSXTBPFJOJ64NSYRFE2F6P6TPMMSD45KQZH5TEWIBEAHICY6IZVGCET';

const createMethod = () =>
    new GetAccountInfo({
        payload: {
            method: 'getAccountInfo',
            coin: 'xlm',
            descriptor: DESCRIPTOR,
            details: 'basic',
        },
    });

describe(GetAccountInfo.name, () => {
    it('describes the account by its network', () => {
        const method = createMethod();

        expect(method.info).toBe('Export Stellar account info');
        expect(method.requiredPermissions).toEqual([
            { permission: 'read_account_info', coin: 'xlm' },
        ]);
    });

    // Trezor Suite derives the descriptor on the device and answers a bundle itself.
    it.each([
        ['an account given by path', { coin: 'btc', path: "m/84'/0'/0'" }],
        ['a bundle', { bundle: [{ coin: 'btc', descriptor: DESCRIPTOR }] }],
    ])('rejects %s', (_, params) => {
        expect(
            () => new GetAccountInfo({ payload: { method: 'getAccountInfo', ...params } as any }),
        ).toThrow(expect.objectContaining({ code: 'Method_NotAllowed' }));
    });

    it('is read only by Trezor Suite', async () => {
        await expect(createMethod().run()).rejects.toMatchObject({ code: 'Method_NotAllowed' });
    });
});
