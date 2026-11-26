import type { GetCoinInfo as GetCoinInfoParams } from '@trezor/connect-common/src/types/api/account/getCoinInfo';

import GetCoinInfo from './getCoinInfo';

const getCoinInfo = (params: GetCoinInfoParams) =>
    new GetCoinInfo({ payload: { method: 'getCoinInfo', ...params } }).run();

describe('GetCoinInfo', () => {
    it('resolves a coin symbol', async () => {
        await expect(getCoinInfo({ coin: 'btc' })).resolves.toMatchObject({
            type: 'bitcoin',
            shortcut: 'BTC',
        });
    });

    it('resolves a path within the requested network family', async () => {
        await expect(
            getCoinInfo({ path: "m/84'/0'/0'", networkType: 'bitcoin' }),
        ).resolves.toMatchObject({ type: 'bitcoin', shortcut: 'BTC' });
        await expect(
            getCoinInfo({ path: "m/44'/60'/0'/0/0", networkType: 'ethereum' }),
        ).resolves.toMatchObject({ type: 'ethereum', shortcut: 'ETH' });
    });

    it('does not resolve a path of another network family', () => {
        expect(() => getCoinInfo({ path: "m/44'/60'/0'/0/0", networkType: 'bitcoin' })).toThrow(
            expect.objectContaining({ code: 'Method_UnknownCoin' }),
        );
        expect(() => getCoinInfo({ path: "m/84'/0'/0'", networkType: 'ethereum' })).toThrow(
            expect.objectContaining({ code: 'Method_UnknownCoin' }),
        );
    });

    it('rejects a path without a network family', () => {
        // @ts-expect-error - the network family is required
        expect(() => getCoinInfo({ path: "m/84'/0'/0'" })).toThrow('Invalid parameter');
    });
});
