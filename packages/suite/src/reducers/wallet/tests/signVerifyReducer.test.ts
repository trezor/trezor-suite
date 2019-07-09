import reducer from '@wallet-reducers/settingsReducer';

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
