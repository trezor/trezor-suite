import { extraDependenciesMock } from '@suite-common/test-utils';

import { initialWalletSettingsState, prepareWalletSettingsReducer } from '../../src';
import * as walletSettingsActions from '../../src/settings/walletSettingsActions';
import { WALLET_SETTINGS } from '../../src/settings/walletSettingsConstants';

const initialState = initialWalletSettingsState;

const reducer = prepareWalletSettingsReducer(extraDependenciesMock);

describe('settings reducer', () => {
    it('test initial state', () => {
        expect(
            reducer(undefined, {
                type: 'none',
            }),
        ).toEqual(initialState);
    });

    it('STORAGE.LOAD', () => {
        expect(
            reducer(undefined, {
                type: extraDependenciesMock.actionTypes.storageLoad,
                payload: {
                    walletSettings: initialState,
                },
            } as any),
        ).toEqual(initialState);
    });

    it('SET_LOCAL_CURRENCY', () => {
        expect(
            reducer(undefined, {
                type: walletSettingsActions.setLocalCurrency.type,
                payload: { localCurrency: 'czk' },
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
                type: walletSettingsActions.changeNetworks.type,
                payload: ['eth'],
            }),
        ).toEqual({
            ...initialState,
            enabledNetworks: ['eth'],
        });
    });
});
