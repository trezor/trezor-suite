import reducer, { initialState } from '@wallet-reducers/settingsReducer';
import { STORAGE } from '@suite-actions/constants';
import { WALLET_SETTINGS } from '@settings-actions/constants';

describe('settings reducer', () => {
    it('test initial state', () => {
        expect(
            reducer(undefined, {
                // @ts-expect-error
                type: 'none',
            }),
        ).toEqual(initialState);
    });

    it('STORAGE.LOAD', () => {
        expect(
            reducer(undefined, {
                type: STORAGE.LOAD,
                payload: {
                    walletSettings: initialState,
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
});
