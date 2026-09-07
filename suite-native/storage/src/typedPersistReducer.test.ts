import { type Reducer } from '@reduxjs/toolkit';

import { createMMKVStorageMock } from './mmkvStorage.mock';
import { preparePersistReducer } from './typedPersistReducer';

type FiatState = {
    current: Record<string, unknown>;
    lastWeek: Record<string, unknown>;
    historic: Record<string, Record<number, number>>;
};

const stubFiatReducer: Reducer<FiatState> = (state = { current: {}, lastWeek: {}, historic: {} }) =>
    state;

describe('preparePersistReducer', () => {
    it('restores whitelisted keys without clobbering the rest of the slice', () => {
        const reducer = preparePersistReducer({
            reducer: stubFiatReducer,
            persistedKeys: ['historic'],
            key: 'fiat',
            version: 1,
            storage: createMMKVStorageMock(),
        });

        const rehydrated = reducer(
            { current: { 'btc-usd': 60000 }, lastWeek: {}, historic: {} },
            {
                type: 'persist/REHYDRATE',
                key: 'fiat',
                payload: { historic: { 'btc-usd': { 1700002800: 50000 } } },
            },
        );

        expect(rehydrated.historic).toEqual({ 'btc-usd': { 1700002800: 50000 } });
        expect(rehydrated.current).toEqual({ 'btc-usd': 60000 });
        expect(rehydrated.lastWeek).toEqual({});
    });
});
