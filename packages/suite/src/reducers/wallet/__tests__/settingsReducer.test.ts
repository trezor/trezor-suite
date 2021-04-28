import reducer, { initialState } from '@wallet-reducers/settingsReducer';
import { STORAGE } from '@suite-actions/constants';
import { WALLET_SETTINGS } from '@settings-actions/constants';
import fixtures from '../__fixtures__/settingsReducer';

describe('settings reducer', () => {
    it('test initial state', () => {
        expect(
            reducer(undefined, {
                // @ts-ignore
                type: 'none',
            }),
        ).toEqual(initialState);
    });

    it('STORAGE.LOADED', () => {
        expect(
            reducer(undefined, {
                type: STORAGE.LOADED,
                payload: {
                    wallet: {
                        settings: initialState,
                    },
                },
            } as any),
        ).toEqual(initialState);
    });

    it('SET_LOCAL_CURRENCY', () => {
        expect(
            reducer(undefined, {
                type: WALLET_SETTINGS.SET_LOCAL_CURRENCY,
                localCurrency: 'czk',
            }),
        ).toEqual({
            ...initialState,
            localCurrency: 'czk',
        });
    });

    it('SET_HIDE_BALANCE', () => {
        expect(
            reducer(undefined, {
                type: WALLET_SETTINGS.SET_HIDE_BALANCE,
                toggled: true,
            }),
        ).toEqual({
            ...initialState,
            discreetMode: true,
        });
    });

    it('CHANGE_NETWORKS', () => {
        expect(
            reducer(undefined, {
                type: WALLET_SETTINGS.CHANGE_NETWORKS,
                payload: ['eth'],
            }),
        ).toEqual({
            ...initialState,
            enabledNetworks: ['eth'],
        });
    });

    it('REMOVE_BLOCKBOOK_URL - valid URL', () => {
        expect(
            reducer(fixtures, {
                type: WALLET_SETTINGS.REMOVE_BLOCKBOOK_URL,
                payload: {
                    coin: 'ltc',
                    url: 'https://ltc1.com',
                },
            }),
        ).toEqual({
            ...fixtures,
            blockbookUrls: [
                {
                    coin: 'btc',
                    url: 'https://btc1.com',
                },
                {
                    coin: 'btc',
                    url: 'https://btc2.com',
                },
                {
                    coin: 'ltc',
                    url: 'https://ltc2.com',
                },
            ],
        });
    });

    it('REMOVE_BLOCKBOOK_URL - invalid URL', () => {
        expect(
            reducer(fixtures, {
                type: WALLET_SETTINGS.REMOVE_BLOCKBOOK_URL,
                payload: {
                    coin: 'ltc',
                    url: 'https://not-valid.com',
                },
            }),
        ).toEqual({
            ...fixtures,
            blockbookUrls: [
                {
                    coin: 'btc',
                    url: 'https://btc1.com',
                },
                {
                    coin: 'btc',
                    url: 'https://btc2.com',
                },
                {
                    coin: 'ltc',
                    url: 'https://ltc1.com',
                },
                {
                    coin: 'ltc',
                    url: 'https://ltc2.com',
                },
            ],
        });
    });
});
