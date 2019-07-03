import reducer from '@wallet-reducers/settingsReducer';
import * as types from '@wallet-actions/constants/settingsConstants';

describe('settings reducer', () => {
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

    it('SET_LOCAL_CURRENCY', () => {
        expect(
            reducer(undefined, {
                type: types.SET_LOCAL_CURRENCY,
                localCurrency: 'czk',
            }),
        ).toEqual({
            localCurrency: 'czk',
            hideBalance: false,
            hiddenCoins: [],
            hiddenCoinsExternal: [],
        });
    });

    it('SET_HIDE_BALANCE', () => {
        expect(
            reducer(undefined, {
                type: types.SET_HIDE_BALANCE,
                toggled: true,
            }),
        ).toEqual({
            localCurrency: 'usd',
            hideBalance: true,
            hiddenCoins: [],
            hiddenCoinsExternal: [],
        });
    });

    it('SET_HIDDEN_COINS set single', () => {
        expect(reducer(undefined, { type: types.SET_HIDDEN_COINS, hiddenCoins: ['eth'] })).toEqual({
            localCurrency: 'usd',
            hideBalance: false,
            hiddenCoins: ['eth'],
            hiddenCoinsExternal: [],
        });
    });

    it('SET_HIDDEN_COINS_EXTERNAL set single', () => {
        expect(
            reducer(undefined, {
                type: types.SET_HIDDEN_COINS_EXTERNAL,
                hiddenCoinsExternal: ['eth'],
            }),
        ).toEqual({
            localCurrency: 'usd',
            hideBalance: false,
            hiddenCoins: [],
            hiddenCoinsExternal: ['eth'],
        });
    });
});
