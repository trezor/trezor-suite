import { type AnyAction, combineReducers } from '@reduxjs/toolkit';

import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';

import { fixtures, timestamp } from '../__fixtures__/messageSystemReducer';
import { prepareMessageSystemReducer } from '../messageSystemReducer';

const messageSystemReducer = prepareMessageSystemReducer(extraDependenciesCommonMock);

describe('Message system reducer', () => {
    fixtures.forEach(f => {
        beforeAll(() => {
            jest.spyOn(Date, 'now').mockImplementation(() => timestamp);
        });

        it(f.description, () => {
            const store = configureMockStore({
                extra: {},
                reducer: combineReducers({ messageSystem: messageSystemReducer }),
                preloadedState: { messageSystem: f.initialState },
            });
            f.actions.forEach(a => {
                store.dispatch(a as AnyAction);
            });
            expect(store.getState().messageSystem).toEqual(f.result);
        });
    });
});
