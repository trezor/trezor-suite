import reducer from '@wallet-reducers/settingsReducer';
import * as types from '@wallet-actions/constants/signVerifyConstants';

describe('sign verify reducer', () => {
    it('test initial state', () => {
        expect(
            reducer(undefined, {
                // @ts-ignore
                type: 'none',
            }),
        ).toEqual({
            localCurrency: 'usd',
            hideBalance: false,
            hiddenCoins: [],
            hiddenCoinsExternal: [],
        });
    });
});
