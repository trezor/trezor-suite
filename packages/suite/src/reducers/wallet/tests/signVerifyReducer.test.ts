import reducer from '@wallet-reducers/settingsReducer';

describe('sign verify reducer', () => {
    it('test initial state', () => {
        // @ts-ignore
        expect(reducer(undefined, {})).toEqual({
            localCurrency: 'usd',
            hideBalance: false,
            hiddenCoins: [],
            hiddenCoinsExternal: [],
        });
    });
});
