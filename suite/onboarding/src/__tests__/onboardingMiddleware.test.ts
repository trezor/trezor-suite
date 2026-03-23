import { type Middleware, combineReducers, configureStore, isAction } from '@reduxjs/toolkit';

import { modalReducer } from '@suite/modal';
import { routerAppChanged, routerReducer } from '@suite/router';

import { onboardingMiddleware } from '../onboardingMiddleware';
import { onboardingReducer } from '../onboardingReducer';

describe('onboardingMiddleware', () => {
    it('enables onboarding reducer when onboarding app is opened', async () => {
        const actions: string[] = [];
        const recordActionTypes: Middleware = () => next => action => {
            if (isAction(action)) {
                actions.push(action.type);
            }

            return next(action);
        };

        const store = configureStore({
            reducer: combineReducers({
                onboarding: onboardingReducer,
                router: routerReducer,
                modal: modalReducer,
            }),
            middleware: getDefaultMiddleware =>
                getDefaultMiddleware().concat(recordActionTypes, onboardingMiddleware),
        });

        await store.dispatch(routerAppChanged('onboarding'));

        expect(actions).toEqual([routerAppChanged.type, 'onboarding/enableOnboardingReducer']);
        expect(store.getState().onboarding.isActive).toBe(true);
    });
});
