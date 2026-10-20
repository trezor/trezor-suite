import { deviceInitialState } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type CustomEvmNetworkDefinition,
    type SuspiciousTransactionsFilter,
} from '@suite-common/wallet-types';
import { FirmwareType } from '@trezor/device-utils';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import * as walletSettingsActions from './walletSettingsActions';
import {
    type WalletSettingsReducerDeps,
    initialWalletSettingsState,
    prepareWalletSettingsReducer,
    selectCustomEvmNetworks,
    selectIsHideSuspiciousTransactions,
    selectIsNetworkReserveSettingsVisible,
    selectIsSuspiciousTransactionsBlurringEnabled,
    selectSuspiciousTransactionsFilter,
    walletSettingsPersistedWhitelist,
} from './walletSettingsReducer';
import { customEvmNetworksActions } from '../customNetworks/customEvmNetworksActions';

const initialState = initialWalletSettingsState;
const opSymbol = asNetworkSymbol('op');
const ethSymbol = asNetworkSymbol('eth');
const btcSymbol = asNetworkSymbol('btc');

const walletSettingsReducerDeps: WalletSettingsReducerDeps = {
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadWalletSettings: mockReducer() },
};
const reducer = prepareWalletSettingsReducer(walletSettingsReducerDeps);

describe('settings reducer', () => {
    it('uses the network order from each action payload', () => {
        const state = reducer(initialState, {
            type: walletSettingsActions.changeNetworks.type,
            payload: {
                enabledNetworks: [btcSymbol, ethSymbol],
                supportedNetworks: [ethSymbol, btcSymbol],
            },
        });
        expect(state.enabledNetworks).toEqual([ethSymbol, btcSymbol]);

        const nextState = reducer(state, {
            type: walletSettingsActions.changeNetworks.type,
            payload: {
                enabledNetworks: [ethSymbol, btcSymbol],
                supportedNetworks: [btcSymbol, ethSymbol],
            },
        });
        expect(nextState.enabledNetworks).toEqual([btcSymbol, ethSymbol]);
    });

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
                type: walletSettingsReducerDeps.actionTypes.storageLoad,
                payload: {
                    walletSettings: initialState,
                },
            } as any),
        ).toEqual(initialState);
    });

    it('SET_LOCAL_CURRENCY', () => {
        expect(
            reducer(undefined, {
                type: walletSettingsActions.setBaseCurrency.type,
                payload: { localCurrency: 'czk' },
            }),
        ).toEqual({
            ...initialState,
            localCurrency: 'czk',
        });
    });

    it('CHANGE_NETWORKS', () => {
        expect(
            reducer(undefined, {
                type: walletSettingsActions.changeNetworks.type,
                payload: { enabledNetworks: [ethSymbol], supportedNetworks: [ethSymbol] },
            }),
        ).toEqual({
            ...initialState,
            enabledNetworks: ['eth'],
        });
    });

    it('SET_SUSPICIOUS_TRANSACTIONS_FILTER sets the filter only for the given network', () => {
        const hidden = reducer(
            undefined,
            walletSettingsActions.setSuspiciousTransactionsFilter({
                symbol: opSymbol,
                filter: 'hideSuspicious',
            }),
        );

        expect(hidden).toEqual({
            ...initialState,
            suspiciousTransactionsFilter: { op: 'hideSuspicious' },
        });

        const unblurred = reducer(
            hidden,
            walletSettingsActions.setSuspiciousTransactionsFilter({
                symbol: ethSymbol,
                filter: 'showUnblurred',
            }),
        );

        expect(unblurred).toEqual({
            ...initialState,
            suspiciousTransactionsFilter: { op: 'hideSuspicious', eth: 'showUnblurred' },
        });
    });

    it('SET_SUSPICIOUS_TRANSACTIONS_FILTER removes the entry when set back to the default', () => {
        const hidden = reducer(
            undefined,
            walletSettingsActions.setSuspiciousTransactionsFilter({
                symbol: opSymbol,
                filter: 'hideSuspicious',
            }),
        );

        const reset = reducer(
            hidden,
            walletSettingsActions.setSuspiciousTransactionsFilter({
                symbol: opSymbol,
                filter: 'showAll',
            }),
        );

        expect(reset).toEqual(initialState);
    });
});

describe('suspicious transactions filter selectors', () => {
    const buildState = (
        suspiciousTransactionsFilter: Partial<Record<NetworkSymbol, SuspiciousTransactionsFilter>>,
    ) => ({
        wallet: {
            settings: {
                ...initialState,
                suspiciousTransactionsFilter,
            },
        },
    });
    const state = buildState({ [opSymbol]: 'hideSuspicious', [ethSymbol]: 'showUnblurred' });

    it('selectSuspiciousTransactionsFilter falls back to showAll', () => {
        expect(selectSuspiciousTransactionsFilter(state, opSymbol)).toBe('hideSuspicious');
        expect(selectSuspiciousTransactionsFilter(state, ethSymbol)).toBe('showUnblurred');
        expect(selectSuspiciousTransactionsFilter(state, btcSymbol)).toBe('showAll');
    });

    it('selectIsHideSuspiciousTransactions returns true only for hiding networks', () => {
        expect(selectIsHideSuspiciousTransactions(state, opSymbol)).toBe(true);
        expect(selectIsHideSuspiciousTransactions(state, ethSymbol)).toBe(false);
        expect(selectIsHideSuspiciousTransactions(state, btcSymbol)).toBe(false);
    });

    it('selectIsSuspiciousTransactionsBlurringEnabled returns false only for unblurred networks', () => {
        expect(selectIsSuspiciousTransactionsBlurringEnabled(state, opSymbol)).toBe(true);
        expect(selectIsSuspiciousTransactionsBlurringEnabled(state, ethSymbol)).toBe(false);
        expect(selectIsSuspiciousTransactionsBlurringEnabled(state, btcSymbol)).toBe(true);
    });
});

describe('selectIsNetworkReserveSettingsVisible', () => {
    const getState = (firmwareType: FirmwareType) => ({
        device: {
            ...deviceInitialState,
            selectedDevice: mockSuiteDevice({ firmwareType }),
        },
    });

    it('returns true for a device with universal firmware', () => {
        expect(selectIsNetworkReserveSettingsVisible(getState(FirmwareType.Universal))).toBe(true);
    });

    it('returns false for a device with bitcoin-only firmware', () => {
        expect(selectIsNetworkReserveSettingsVisible(getState(FirmwareType.BitcoinOnly))).toBe(
            false,
        );
    });
});

describe('settings reducer custom EVM networks', () => {
    const customSymbol = asNetworkSymbol('evm4242');
    const definition: CustomEvmNetworkDefinition = {
        symbol: customSymbol,
        chainId: 4242,
        name: 'Custom Chain',
        displaySymbol: 'CST',
        currencyName: 'Custom Token',
        rpcUrls: ['https://rpc.custom.example'],
        explorerUrl: 'https://explorer.custom.example',
        testnet: false,
    };

    it('persists the custom networks', () => {
        expect(walletSettingsPersistedWhitelist).toContain('customEvmNetworks');
    });

    it('stores a registered definition once, the latest one wins', () => {
        const registered = reducer(undefined, customEvmNetworksActions.registered({ definition }));
        const renamed = reducer(
            registered,
            customEvmNetworksActions.registered({ definition: { ...definition, name: 'Renamed' } }),
        );

        expect(selectCustomEvmNetworks({ wallet: { settings: renamed } })).toEqual([
            { ...definition, name: 'Renamed' },
        ]);
    });

    it('forgets the definition and the per-network settings on unregistration', () => {
        const registered = reducer(
            reducer(undefined, customEvmNetworksActions.registered({ definition })),
            walletSettingsActions.changeNetworks(
                [ethSymbol, customSymbol],
                [ethSymbol, customSymbol],
            ),
        );
        const hidden = reducer(
            registered,
            walletSettingsActions.setSuspiciousTransactionsFilter({
                symbol: customSymbol,
                filter: 'hideSuspicious',
            }),
        );

        const state = reducer(
            hidden,
            customEvmNetworksActions.unregistered({ symbol: customSymbol }),
        );

        expect(state).toEqual({ ...initialState, enabledNetworks: [ethSymbol] });
    });
});
