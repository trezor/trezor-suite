import { bioAuthActions } from 'src/actions/suite/bioAuthActions';
import { STORAGE } from 'src/actions/suite/constants';
import { extraDependencies } from 'src/support/extraDependencies';
import { PreloadStoreAction } from 'src/support/suite/preloadStore';
import { Action } from 'src/types/suite';

import fixtures from '../__fixtures__/bioAuthReducer';
import {
    prepareBioAuthReducer,
    selectIsAppUiHidden,
    selectIsBioAuthValidationRequired,
} from '../index';

const bioAuthReducer = prepareBioAuthReducer(extraDependencies);

describe('bioAuthReducer', () => {
    describe('SET_BIO_AUTH_ENABLED', () => {
        fixtures.setBioAuthEnabled.forEach(f => {
            it(f.description, () => {
                let state = f.initialState;
                f.actions.forEach(a => {
                    state = bioAuthReducer(state, a);
                });
                expect(state).toEqual(f.result);
            });
        });
    });

    describe('REQUEST_BIO_AUTH_CHANGE', () => {
        fixtures.requestBioAuthChange.forEach(f => {
            it(f.description, () => {
                let state = f.initialState;
                f.actions.forEach(a => {
                    state = bioAuthReducer(state, a);
                });
                expect(state).toEqual(f.result);
            });
        });
    });

    describe('REQUEST_BIO_AUTH_CHANGE_END', () => {
        fixtures.requestBioAuthChangeEnd.forEach(f => {
            it(f.description, () => {
                const nextState = f.actions.reduce(bioAuthReducer, f.initialState);
                expect(nextState).toEqual(f.result);
            });
        });
    });

    describe('REQUEST_BIO_AUTH_VALIDATED', () => {
        fixtures.bioAuthValidated.forEach(f => {
            it(f.description, () => {
                const nextState = f.actions.reduce(bioAuthReducer, f.initialState);
                expect(nextState).toEqual(f.result);
            });
        });
    });

    describe('BIO_AUTH_WINDOW_BLUR', () => {
        fixtures.bioAuthWindowBlur.forEach(f => {
            it(f.description, () => {
                let state = f.initialState;
                f.actions.forEach(a => {
                    state = bioAuthReducer(state, a);
                });
                expect(state).toEqual(f.result);
            });
        });
    });

    describe('BIO_AUTH_WINDOW_FOCUS', () => {
        fixtures.bioAuthWindowFocus.forEach(f => {
            it(f.description, () => {
                const nextState = f.actions.reduce(bioAuthReducer, f.initialState);
                expect(nextState).toEqual(f.result);
            });
        });
    });

    describe('TOGGLE_BIO_AUTH_VALIDATION_REQUESTED', () => {
        fixtures.toggleBioAuthValidationRequested.forEach(f => {
            it(f.description, () => {
                const nextState = f.actions.reduce(bioAuthReducer, f.initialState);
                expect(nextState).toEqual(f.result);
            });
        });
    });

    describe('SET_BIO_AUTH_AVAILABLE', () => {
        fixtures.setBioAuthAvailable.forEach(f => {
            it(f.description, () => {
                const nextState = f.actions.reduce(bioAuthReducer, f.initialState);
                expect(nextState).toEqual(f.result);
            });
        });
    });

    describe('Selectors', () => {
        fixtures.selectorsTests.forEach(f => {
            it(f.description, () => {
                const rootState = { bioAuth: f.initialState };

                if (f.testSelector === 'selectIsBioAuthValidationRequired') {
                    const result = selectIsBioAuthValidationRequired(
                        rootState,
                        f.testSelectorParams || new Date('2023-01-01T12:00:00Z'),
                    );
                    expect(result).toEqual(f.expectedResult);
                } else if (f.testSelector === 'selectIsAppUiHidden') {
                    const result = selectIsAppUiHidden(rootState);
                    expect(result).toEqual(f.expectedResult);
                }
            });
        });
    });

    it('should handle storage load action', () => {
        const action: Action = {
            type: STORAGE.LOAD,
            payload: {
                bioAuth: {
                    bioAuthEnabled: true,
                },
            },
        } as Extract<PreloadStoreAction, { type: typeof STORAGE.LOAD }>;

        const state = bioAuthReducer(undefined, action);
        expect(state.bioAuthEnabled).toBe(true);
    });

    it('should handle initial state', () => {
        const state = bioAuthReducer(undefined, { type: 'unknown' } as any);
        expect(state).toEqual({
            bioAuthEnabled: false,
            bioAuthEnabledNextValue: null,
            lastBioAuthValidatedTimestamp: null,
            lastWindowBlurTimestamp: null,
            bioAuthValidationInProgress: false,
            bioAuthValidationRequested: false,
            windowBlurred: false,
            bioAuthAvailable: null,
            bioAuthValidationRequired: false,
            blurTimeoutId: null,
            initialNow: 0,
        });
    });

    describe('bioAuthWindowFocus time comparison', () => {
        it('should reset lastWindowBlurTimestamp to null when blur duration is less than or equal to 5 minutes', () => {
            // Set up initial state with a blur timestamp 3 minutes ago
            const blurTimestamp = new Date('2023-01-01T12:00:00Z').getTime();
            const initialState = {
                ...fixtures.setBioAuthEnabled[0].initialState,
                lastWindowBlurTimestamp: blurTimestamp,
                windowBlurred: true,
            };

            // Create focus action with a timestamp 3 minutes after the blur
            const focusAction = bioAuthActions.bioAuthWindowFocus('2023-01-01T12:03:00Z');

            // Apply the action
            const resultState = bioAuthReducer(initialState, focusAction);

            // Verify lastWindowBlurTimestamp is reset to null (blur was less than or equal to 5 minutes)
            expect(resultState.lastWindowBlurTimestamp).toBeNull();
            expect(resultState.windowBlurred).toBe(false);
        });
    });

    describe('isBlurredTooLong function', () => {
        it('should return false when lastWindowBlurTimestamp is null', () => {
            const state = {
                bioAuth: {
                    ...fixtures.setBioAuthEnabled[0].initialState,
                    lastWindowBlurTimestamp: null,
                },
            };
            const result = selectIsBioAuthValidationRequired(
                state,
                new Date('2023-01-01T12:00:00Z'),
            );
            expect(result).toBe(false);
        });

        it('should return true when window was blurred for more than 5 minutes', () => {
            const blurTimestamp = new Date('2023-01-01T12:00:00Z').getTime();
            const state = {
                bioAuth: {
                    ...fixtures.setBioAuthEnabled[0].initialState,
                    bioAuthEnabled: true,
                    lastWindowBlurTimestamp: blurTimestamp,
                },
            };
            const result = selectIsBioAuthValidationRequired(
                state,
                new Date('2023-01-01T12:06:00Z'),
            );
            expect(result).toBe(true);
        });

        it('should return false when window was blurred for less than 5 minutes', () => {
            const blurTimestamp = new Date('2023-01-01T12:00:00Z').getTime();
            const validatedTimestamp = new Date('2023-01-01T11:55:00Z').getTime();
            const state = {
                bioAuth: {
                    ...fixtures.setBioAuthEnabled[0].initialState,
                    bioAuthEnabled: true,
                    lastWindowBlurTimestamp: blurTimestamp,
                    lastBioAuthValidatedTimestamp: validatedTimestamp,
                },
            };
            const result = selectIsBioAuthValidationRequired(
                state,
                new Date('2023-01-01T12:04:00Z'),
            );
            expect(result).toBe(false);
        });
    });
});
