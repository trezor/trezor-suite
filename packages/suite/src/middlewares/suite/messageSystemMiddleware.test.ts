import { type Reducer, type UnknownAction, combineReducers, createReducer } from '@reduxjs/toolkit';

import { type TorState, torReducer } from '@suite/tor';
import { type DeviceReducerState, prepareDeviceReducer } from '@suite-common/device';
import { type DiscreetModeState } from '@suite-common/discreet-mode';
import { type GeolocationState, geolocationReducer } from '@suite-common/geolocation';
import {
    type MessageSystemState,
    messageSystemActions,
    prepareMessageSystemReducer,
} from '@suite-common/message-system';
import {
    getValidExperimentIds,
    getValidMessages,
} from '@suite-common/message-system/src/messageSystemUtils';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { type Action } from '@suite-common/suite-types';
import { createTestCompositionRoot } from '@suite-common/test-utils';

import suiteReducer, { type SuiteState } from 'src/reducers/suite/suiteReducer';
import { type WalletState, walletReducers } from 'src/reducers/wallet';

import messageSystemMiddleware from './messageSystemMiddleware';

jest.mock('@suite-common/message-system/src/messageSystemUtils', () => ({
    ...jest.requireActual('@suite-common/message-system/src/messageSystemUtils'),
    getValidMessages: jest.fn(),
    getValidExperimentIds: jest.fn(),
}));
const messageSystemReducer: Reducer<MessageSystemState, UnknownAction> =
    prepareMessageSystemReducer({
        actionTypes: { storageLoad: mockActionType('storageLoad') },
    });
const deviceReducer = prepareDeviceReducer({
    actionTypes: {
        setDeviceMetadata: mockActionType('setDeviceMetadata'),
        setDeviceMetadataPasswords: mockActionType('setDeviceMetadataPasswords'),
        storageLoad: mockActionType('storageLoad'),
    },
    reducers: {
        setDeviceMetadataPasswordsReducer: mockReducer(),
        setDeviceMetadataReducer: mockReducer(),
        storageLoadDevices: mockReducer(),
    },
});

const getInitialState = (
    messageSystem?: Partial<MessageSystemState>,
    wallet?: Partial<WalletState>,
    suite?: Partial<SuiteState>,
): Pick<StoreState, 'wallet' | 'messageSystem' | 'suite' | 'geolocation'> => ({
    wallet: {
        ...walletReducers(undefined, { type: 'foo' } as any),
        ...wallet,
    },
    messageSystem: {
        ...messageSystemReducer(undefined, { type: 'foo' } as any),
        ...messageSystem,
    },
    suite: {
        ...suiteReducer(undefined, { type: 'foo' } as any),
        ...suite,
    },
    geolocation: {
        countryCode: null,
    },
});

const makeTestAction = (id: string): Action => ({
    message: {
        id,
        category: 'banner',
        priority: 0,
        dismissible: true,
        variant: 'info',
        content: { en: '', es: '', cs: '', de: '', fr: '', pt: '' },
    },
    conditions: [],
});

const reducer = combineReducers({
    wallet: walletReducers,
    messageSystem: messageSystemReducer,
    suite: suiteReducer,
    tor: torReducer,
    discreetMode: createReducer({ isActive: false }, () => {}),
    device: deviceReducer,
    geolocation: geolocationReducer,
});
type StoreState = {
    wallet: WalletState;
    messageSystem: MessageSystemState;
    suite: SuiteState;
    tor: TorState;
    discreetMode: DiscreetModeState;
    device: DeviceReducerState;
    geolocation: GeolocationState;
};

const initStore = (
    preloadedState: Pick<StoreState, 'wallet' | 'messageSystem' | 'suite' | 'geolocation'>,
) => {
    const { store } = createTestCompositionRoot<void, StoreState>({
        reducer,
        preloadedState,
        middleware: [messageSystemMiddleware],
    }).services;
    store.subscribe(() => {
        const action = store.getActions().pop();
        if (action) {
            const { suite, messageSystem, wallet } = store.getState();

            store.getState().suite = suiteReducer(suite, action);
            store.getState().messageSystem = messageSystemReducer(messageSystem, action);
            if (wallet) store.getState().wallet = walletReducers(wallet, action);

            store.getActions().push(action);
        }
    });

    return store;
};

describe('Message system middleware', () => {
    it('prepares valid messages for being displayed', () => {
        const message1 = {
            id: '22e6444d-a586-4593-bc8d-5d013f193eba',
            category: 'banner',
        };
        const message2 = {
            id: '469c65a8-8632-11eb-8dcd-0242ac130003',
            category: ['banner', 'context', 'modal'],
        };
        const message3 = {
            id: '506b1322-8632-11eb-8dcd-0242ac130003',
            category: ['modal'],
        };
        const message4 = {
            id: '506b1322-8632-11eb-8dcd-0242ac130004',
            category: 'feature',
        };

        (getValidMessages as jest.Mock).mockImplementation(() => [
            message1,
            message2,
            message3,
            message4,
        ]);
        (getValidExperimentIds as jest.Mock).mockImplementation(() => []);

        const store = initStore(getInitialState(undefined, undefined));
        store.dispatch({
            type: messageSystemActions.fetchSuccessUpdate.type,
            payload: { config: { sequence: 1 }, timestamp: 0 },
        });

        const result = store.getActions();
        expect(result).toEqual([
            {
                type: messageSystemActions.fetchSuccessUpdate.type,
                payload: { config: { sequence: 1 }, timestamp: 0 },
            },
            {
                type: messageSystemActions.updateValidMessages.type,
                payload: {
                    banner: [message1.id, message2.id],
                    modal: [message2.id, message3.id],
                    context: [message2.id],
                    feature: [message4.id],
                },
            },
            {
                type: messageSystemActions.updateValidExperiments.type,
                payload: [],
            },
        ]);
    });

    it('saves messages even if there are no valid messages', () => {
        (getValidMessages as jest.Mock).mockImplementation(() => []);
        (getValidExperimentIds as jest.Mock).mockImplementation(() => []);

        const store = initStore(getInitialState(undefined, undefined));
        store.dispatch({
            type: messageSystemActions.fetchSuccessUpdate.type,
            payload: { config: { sequence: 1 }, timestamp: 0 },
        });

        const result = store.getActions();
        expect(result).toEqual([
            {
                type: messageSystemActions.fetchSuccessUpdate.type,
                payload: { config: { sequence: 1 }, timestamp: 0 },
            },
            {
                type: messageSystemActions.updateValidMessages.type,
                payload: { banner: [], context: [], modal: [], feature: [] },
            },
            {
                type: messageSystemActions.updateValidExperiments.type,
                payload: [],
            },
        ]);
    });

    it('keeps in-app messages when new file config arrives', () => {
        (getValidMessages as jest.Mock).mockImplementation(() => []);
        (getValidExperimentIds as jest.Mock).mockImplementation(() => []);

        const manuallyAddedMessageId = 'inapp-1';
        const fileOldId = 'file-1';
        const fileNewId = 'file-2';

        const inAppAction = makeTestAction(manuallyAddedMessageId);
        const fileOldAction = makeTestAction(fileOldId);
        const fileNewAction = makeTestAction(fileNewId);

        const store = initStore(
            getInitialState(
                {
                    config: {
                        sequence: 1,
                        version: 1,
                        timestamp: '123',
                        actions: [inAppAction, fileOldAction],
                    },
                    manuallyAddedMessageIds: {
                        [manuallyAddedMessageId]: true,
                    },
                    manuallyAddedExperimentIds: {},
                },
                undefined,
                undefined,
            ),
        );

        store.dispatch({
            type: messageSystemActions.fetchSuccessUpdate.type,
            payload: {
                config: {
                    sequence: 2,
                    actions: [fileNewAction],
                },
                timestamp: 123,
            },
        });

        const { messageSystem } = store.getState();
        const ids = (messageSystem.config?.actions ?? []).map((a: any) => a.message.id);

        expect(ids).toEqual([manuallyAddedMessageId, fileNewId]);

        expect(messageSystem.manuallyAddedMessageIds[manuallyAddedMessageId]).toBe(true);
    });

    it('test of experiment action', () => {
        const experiment1 = {
            id: '3bed56a4-ecd8-4e0f-9e5f-014b484c2afa',
            groups: [
                {
                    variant: 'A',
                    percentage: 25,
                },
                {
                    variant: 'B',
                    percentage: 75,
                },
            ],
        };

        (getValidExperimentIds as jest.Mock).mockImplementation(() => [experiment1.id]);

        const store = initStore(getInitialState(undefined, undefined));
        store.dispatch({
            type: messageSystemActions.fetchSuccessUpdate.type,
            payload: { config: { sequence: 1 }, timestamp: 0 },
        });

        const result = store.getActions();
        expect(result).toEqual([
            {
                type: messageSystemActions.fetchSuccessUpdate.type,
                payload: { config: { sequence: 1 }, timestamp: 0 },
            },
            {
                type: messageSystemActions.updateValidMessages.type,
                payload: { banner: [], context: [], modal: [], feature: [] },
            },
            {
                type: messageSystemActions.updateValidExperiments.type,
                payload: [experiment1.id],
            },
        ]);
    });
});
