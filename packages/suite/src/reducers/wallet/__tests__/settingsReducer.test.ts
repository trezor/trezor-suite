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

    it('REMOVE_BACKEND - valid', () => {
        expect(
            reducer(fixtures, {
                type: WALLET_SETTINGS.REMOVE_BACKEND,
                payload: {
                    coin: 'btc',
                },
            }),
        ).toEqual({
            ...fixtures,
            backends: {
                ltc: {
                    type: 'blockbook',
                    urls: ['https://ltc1.com', 'https://ltc2.com'],
                },
            },
        });
    });

    it('SET_CARDANO_DERIVATION_TYPE - set different derivation', () => {
        expect(
            reducer(fixtures, {
                type: WALLET_SETTINGS.SET_CARDANO_DERIVATION_TYPE,
                payload: {
                    value: 2,
                    label: 'Icarus Trezor',
                },
            }),
        ).toEqual({
            ...fixtures,
            cardanoDerivationType: {
                value: 2,
                label: 'Icarus Trezor',
            },
        });
    });

    it('REMOVE_BACKEND - invalid', () => {
        expect(
            reducer(fixtures, {
                type: WALLET_SETTINGS.REMOVE_BACKEND,
                payload: {
                    coin: 'eth',
                },
            }),
        ).toEqual(fixtures);
    });
});
