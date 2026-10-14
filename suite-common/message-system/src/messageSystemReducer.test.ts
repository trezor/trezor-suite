import { type UnknownAction, combineReducers } from '@reduxjs/toolkit';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { mockActionType } from '@trezor/redux-utils/mocks';

import { fixtures, timestamp } from './__fixtures__/messageSystemReducer';
import { prepareMessageSystemReducer } from './messageSystemReducer';
import { type MessageSystemRootState } from './messageSystemTypes';

const messageSystemReducer = prepareMessageSystemReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

describe('Message system reducer', () => {
    fixtures.forEach(f => {
        beforeAll(() => {
            jest.spyOn(Date, 'now').mockImplementation(() => timestamp);
        });

        it(f.description, () => {
            const { store } = createTestCompositionRoot<void, MessageSystemRootState>({
                reducer: combineReducers({ messageSystem: messageSystemReducer }),
                preloadedState: { messageSystem: f.initialState },
            }).services;
            f.actions.forEach(a => {
                store.dispatch(a as UnknownAction);
            });
            expect(store.getState().messageSystem).toEqual(f.result);
        });
    });
});
