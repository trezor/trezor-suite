import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore } from '@suite-common/test-utils';
import { asAccountDescriptor, asWalletDescriptor } from '@suite-common/wallet-types';
import { getAccountKey } from '@suite-common/wallet-utils';
import { StaticSessionId } from '@trezor/connect';

import {
    clearAllLabels,
    setAccountLabel,
    setAddressLabel,
    setOutputLabel,
    setWalletLabel,
} from '../labelingActions';
import { LabelingState, labelingReducer } from '../labelingReducer';
import {
    selectAccountLabel,
    selectAccountLabels,
    selectAddressLabel,
    selectAddressLabels,
    selectOutputLabel,
    selectOutputLabels,
    selectWalletLabel,
} from '../labelingSelectors';

const initialState: LabelingState = {
    walletsLabels: {},
};

const walletDescriptor = asWalletDescriptor('mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q');
const deviceStaticSessionId = `${walletDescriptor}@device-id` as StaticSessionId;

describe('labelingReducer', () => {
    it('sets wallet label', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ labeling: labelingReducer }),
            preloadedState: { labeling: initialState },
        });

        expect(store.getState().labeling.walletsLabels).toEqual({});
        store.dispatch(setWalletLabel({ walletDescriptor, label: 'Drugs and Hoes' }));
        expect(selectWalletLabel({ state: store.getState(), deviceStaticSessionId })).toBe(
            'Drugs and Hoes',
        );
    });

    it('updates wallet label (existing wallet state)', () => {
        const preloaded: LabelingState = {
            walletsLabels: {
                [walletDescriptor]: {
                    walletLabel: 'Old Label',
                    accountLabels: [],
                    addressLabels: [],
                    outputLabels: [],
                },
            },
        };

        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ labeling: labelingReducer }),
            preloadedState: { labeling: preloaded },
        });

        expect(selectWalletLabel({ state: store.getState(), deviceStaticSessionId })).toBe(
            'Old Label',
        );
        store.dispatch(setWalletLabel({ walletDescriptor, label: 'New Label' }));
        expect(selectWalletLabel({ state: store.getState(), deviceStaticSessionId })).toBe(
            'New Label',
        );

        store.dispatch(setWalletLabel({ walletDescriptor, label: null }));
        expect(selectWalletLabel({ state: store.getState(), deviceStaticSessionId })).toBe(null);
    });

    it('adds and updates account label (insert then update path)', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ labeling: labelingReducer }),
            preloadedState: { labeling: initialState },
        });

        const accDesc = asAccountDescriptor('accdesc1');
        store.dispatch(
            setAccountLabel({
                walletDescriptor,
                accountDescriptor: accDesc,
                networkSymbol: 'btc',
                label: 'Account One',
            }),
        );

        const accountLabels = selectAccountLabels({
            state: store.getState(),
            deviceStaticSessionId,
        });
        expect(accountLabels).toHaveLength(1);
        expect(accountLabels[0].accountDescriptor).toBe(accDesc);
        expect(accountLabels[0].networkSymbol).toBe('btc');
        expect(accountLabels[0].label).toBe('Account One');

        store.dispatch(
            setAccountLabel({
                walletDescriptor,
                accountDescriptor: accDesc,
                networkSymbol: 'btc',
                label: 'Account One Updated',
            }),
        );

        const accountKey = getAccountKey(asAccountDescriptor('accdesc1'), 'btc', 'ignored@1:2');
        expect(
            selectAccountLabel({
                state: store.getState(),
                walletDescriptor,
                accountKey,
            }),
        ).toBe('Account One Updated');
    });

    it('inserts multiple account labels and updates the second', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ labeling: labelingReducer }),
            preloadedState: { labeling: initialState },
        });

        const accDesc1 = asAccountDescriptor('accdesc1');
        const accDesc2 = asAccountDescriptor('accdesc2');

        store.dispatch(
            setAccountLabel({
                walletDescriptor,
                accountDescriptor: accDesc1,
                networkSymbol: 'btc',
                label: 'Account One',
            }),
        );

        store.dispatch(
            setAccountLabel({
                walletDescriptor,
                accountDescriptor: accDesc2,
                networkSymbol: 'btc',
                label: 'Account Two',
            }),
        );

        const labels = selectAccountLabels({ state: store.getState(), deviceStaticSessionId });
        expect(labels).toHaveLength(2);
        expect(labels[0].label).toBe('Account One');
        expect(labels[1].label).toBe('Account Two');

        store.dispatch(
            setAccountLabel({
                walletDescriptor,
                accountDescriptor: accDesc2,
                networkSymbol: 'btc',
                label: 'Account Two Updated',
            }),
        );

        const updatedLabels = selectAccountLabels({
            state: store.getState(),
            deviceStaticSessionId,
        });
        expect(updatedLabels).toHaveLength(2);
        expect(updatedLabels[0].label).toBe('Account One');
        expect(updatedLabels[1].label).toBe('Account Two Updated');
    });

    it('adds and updates address label (insert then update path)', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ labeling: labelingReducer }),
            preloadedState: { labeling: initialState },
        });

        store.dispatch(
            setAddressLabel({
                walletDescriptor,
                address: 'tb1qexampleaddressxyz',
                label: 'First Address',
                accountDescriptor: 'test-descriptor-123',
                networkSymbol: 'btc',
            }),
        );

        const addrLabels = selectAddressLabels({
            state: store.getState(),
            deviceStaticSessionId,
        });
        expect(addrLabels).toHaveLength(1);
        expect(
            selectAddressLabel({
                state: store.getState(),
                deviceStaticSessionId,
                address: 'tb1qexampleaddressxyz',
            }),
        ).toBe('First Address');

        store.dispatch(
            setAddressLabel({
                walletDescriptor,
                address: 'tb1qexampleaddressxyz',
                label: 'First Address Updated',
                accountDescriptor: 'test-descriptor-123',
                networkSymbol: 'btc',
            }),
        );

        const updatedAddrLabels = selectAddressLabels({
            state: store.getState(),
            deviceStaticSessionId,
        });
        expect(updatedAddrLabels).toHaveLength(1);
        expect(
            selectAddressLabel({
                state: store.getState(),
                deviceStaticSessionId,
                address: 'tb1qexampleaddressxyz',
            }),
        ).toBe('First Address Updated');
    });

    it('inserts multiple address labels and updates the second', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ labeling: labelingReducer }),
            preloadedState: { labeling: initialState },
        });

        store.dispatch(
            setAddressLabel({
                walletDescriptor,
                address: 'tb1qaddress1',
                label: 'Address 1',
                accountDescriptor: 'test-descriptor-123',
                networkSymbol: 'btc',
            }),
        );

        store.dispatch(
            setAddressLabel({
                walletDescriptor,
                address: 'tb1qaddress2',
                label: 'Address 2',
                accountDescriptor: 'test-descriptor-123',
                networkSymbol: 'btc',
            }),
        );

        const addrLabels = selectAddressLabels({
            state: store.getState(),
            deviceStaticSessionId,
        });
        expect(addrLabels).toHaveLength(2);
        expect(addrLabels[0].label).toBe('Address 1');
        expect(addrLabels[1].label).toBe('Address 2');

        store.dispatch(
            setAddressLabel({
                walletDescriptor,
                address: 'tb1qaddress2',
                label: 'Address 2 Updated',
                accountDescriptor: 'test-descriptor-123',
                networkSymbol: 'btc',
            }),
        );

        const updatedAddrLabels = selectAddressLabels({
            state: store.getState(),
            deviceStaticSessionId,
        });
        expect(updatedAddrLabels).toHaveLength(2);
        expect(updatedAddrLabels[0].label).toBe('Address 1');
        expect(updatedAddrLabels[1].label).toBe('Address 2 Updated');
        expect(updatedAddrLabels[0].accountDescriptor).toBe('test-descriptor-123');
        expect(updatedAddrLabels[1].networkSymbol).toBe('btc');
    });

    it('adds and updates output label (insert then update path)', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ labeling: labelingReducer }),
            preloadedState: { labeling: initialState },
        });

        store.dispatch(
            setOutputLabel({
                walletDescriptor,
                txId: 'deadbeefcafebabe',
                outputIndex: 0,
                label: 'Output 0',
                accountDescriptor: 'xpub...',
                networkSymbol: 'btc',
            }),
        );

        const outLabels = selectOutputLabels(store.getState(), deviceStaticSessionId);
        expect(outLabels).toHaveLength(1);
        expect(
            selectOutputLabel({
                state: store.getState(),
                deviceStaticSessionId,
                txId: 'deadbeefcafebabe',
                outputIndex: 0,
            }),
        ).toBe('Output 0');

        store.dispatch(
            setOutputLabel({
                walletDescriptor,
                txId: 'deadbeefcafebabe',
                outputIndex: 0,
                label: 'Output 0 Updated',
                accountDescriptor: 'xpub...',
                networkSymbol: 'btc',
            }),
        );

        const updatedOutLabels = selectOutputLabels(store.getState(), deviceStaticSessionId);
        expect(updatedOutLabels).toHaveLength(1);
        expect(
            selectOutputLabel({
                state: store.getState(),
                deviceStaticSessionId,
                txId: 'deadbeefcafebabe',
                outputIndex: 0,
            }),
        ).toBe('Output 0 Updated');
    });

    it('clears all labels for a wallet (remove whole entry)', () => {
        const preloaded: LabelingState = {
            walletsLabels: {},
        };
        preloaded.walletsLabels[walletDescriptor] = {
            walletLabel: 'To be removed',
            accountLabels: [
                {
                    accountDescriptor: asAccountDescriptor('acc-desc-1'),
                    networkSymbol: 'btc',
                    label: 'Account',
                },
            ],
            addressLabels: [
                {
                    address: 'tb1qexampleaddressxyz',
                    label: 'Address',
                    accountDescriptor: 'test-descriptor-123',
                    networkSymbol: 'btc',
                },
            ],
            outputLabels: [
                {
                    txId: 'deadbeefcafebabe',
                    outputIndex: 0,
                    label: 'Output 0',
                    accountDescriptor: 'xpub...',
                    networkSymbol: 'btc',
                },
            ],
        };

        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ labeling: labelingReducer }),
            preloadedState: { labeling: preloaded },
        });

        expect(store.getState().labeling.walletsLabels[walletDescriptor]).toBeDefined();
        store.dispatch(clearAllLabels({ walletDescriptor }));
        expect(store.getState().labeling.walletsLabels[walletDescriptor]).toBeUndefined();
    });
});
