import reducer, { initialState } from '@wallet-reducers/settingsReducer';
import { STORAGE } from '@suite-actions/constants';
import { SETTINGS } from '@wallet-actions/constants';

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
                type: SETTINGS.SET_LOCAL_CURRENCY,
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
                type: SETTINGS.SET_HIDE_BALANCE,
                toggled: true,
            }),
        ).toEqual({
            ...initialState,
            hideBalance: true,
        });
    });

    it('CHANGE_NETWORKS', () => {
        expect(
            reducer(undefined, {
                type: SETTINGS.CHANGE_NETWORKS,
                payload: ['eth'],
            }),
        ).toEqual({
            ...initialState,
            enabledNetworks: ['eth'],
        });
    });

    it('CHANGE_EXTERNAL_NETWORKS', () => {
        expect(
            reducer(undefined, {
                type: SETTINGS.CHANGE_EXTERNAL_NETWORKS,
                payload: ['xem'],
            }),
        ).toEqual({
            ...initialState,
            enabledExternalNetworks: ['xem'],
        });
    });
});
