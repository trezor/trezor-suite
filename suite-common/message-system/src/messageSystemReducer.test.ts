import { type UnknownAction, combineReducers } from '@reduxjs/toolkit';

import { mockActionType } from '@suite-common/redux-utils/mocks';
import { configureMockStore } from '@suite-common/test-utils';

import { fixtures, timestamp } from './__fixtures__/messageSystemReducer';
import { prepareMessageSystemReducer } from './messageSystemReducer';

const messageSystemReducer = prepareMessageSystemReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

describe('Message system reducer', () => {
    fixtures.forEach(f => {
        beforeAll(() => {
            jest.spyOn(Date, 'now').mockImplementation(() => timestamp);
        });

        it(f.description, () => {
            const store = configureMockStore({
                extra: undefined,
                reducer: combineReducers({ messageSystem: messageSystemReducer }),
                preloadedState: { messageSystem: f.initialState },
            });
            f.actions.forEach(a => {
                store.dispatch(a as UnknownAction);
            });
            expect(store.getState().messageSystem).toEqual(f.result);
        });
    });
});
