import { FEEDBACK_THRESHOLD } from '../constants';
import {
    experimentalFeedbackReducer,
    featureUsed,
    feedbackDismissed,
    feedbackRequested,
    initialState,
} from '../experimentalFeedbackSlice';

describe(experimentalFeedbackReducer.name, () => {
    describe(featureUsed.name, () => {
        it('increments usage count across multiple dispatches', () => {
            let state = experimentalFeedbackReducer(initialState, featureUsed('suite-sync'));
            state = experimentalFeedbackReducer(state, featureUsed('suite-sync'));

            expect(state.usageCounts['suite-sync']).toBe(2);
        });

        it('adds feature to pendingFeedbackFeatures when threshold is reached', () => {
            let state = initialState;

            for (let i = 0; i < FEEDBACK_THRESHOLD; i++) {
                state = experimentalFeedbackReducer(state, featureUsed('suite-sync'));
            }

            expect(state.pendingFeedbackFeatures).toContain('suite-sync');
        });

        it('does not add to pendingFeedbackFeatures before threshold is reached', () => {
            let state = initialState;

            for (let i = 0; i < FEEDBACK_THRESHOLD - 1; i++) {
                state = experimentalFeedbackReducer(state, featureUsed('suite-sync'));
            }

            expect(state.pendingFeedbackFeatures).not.toContain('suite-sync');
        });

        it('does not increment count beyond threshold', () => {
            let state = initialState;

            for (let i = 0; i < FEEDBACK_THRESHOLD + 5; i++) {
                state = experimentalFeedbackReducer(state, featureUsed('suite-sync'));
            }

            expect(state.usageCounts['suite-sync']).toBe(FEEDBACK_THRESHOLD);
        });

        it('does not add feature to pendingFeedbackFeatures twice', () => {
            let state = initialState;

            for (let i = 0; i < FEEDBACK_THRESHOLD + 1; i++) {
                state = experimentalFeedbackReducer(state, featureUsed('suite-sync'));
            }

            expect(state.pendingFeedbackFeatures.filter(f => f === 'suite-sync')).toHaveLength(1);
        });

        it('tracks usage counts independently per feature', () => {
            let state = experimentalFeedbackReducer(initialState, featureUsed('suite-sync'));
            state = experimentalFeedbackReducer(state, featureUsed('nft-section'));
            state = experimentalFeedbackReducer(state, featureUsed('nft-section'));

            expect(state.usageCounts['suite-sync']).toBe(1);
            expect(state.usageCounts['nft-section']).toBe(2);
        });
    });

    describe(feedbackRequested.name, () => {
        it('adds feature to pendingFeedbackFeatures', () => {
            const state = experimentalFeedbackReducer(
                initialState,
                feedbackRequested({ feature: 'suite-sync' }),
            );

            expect(state.pendingFeedbackFeatures).toContain('suite-sync');
        });

        it('does not duplicate feature in pendingFeedbackFeatures', () => {
            const stateWithPending = {
                ...initialState,
                pendingFeedbackFeatures: ['suite-sync' as const],
            };

            const state = experimentalFeedbackReducer(
                stateWithPending,
                feedbackRequested({ feature: 'suite-sync' }),
            );

            expect(state.pendingFeedbackFeatures.filter(f => f === 'suite-sync')).toHaveLength(1);
        });

        it('deletes usage count when isFeatureBeingDisabled is true', () => {
            const stateWithCount = {
                ...initialState,
                usageCounts: { 'suite-sync': 2 as const },
            };

            const state = experimentalFeedbackReducer(
                stateWithCount,
                feedbackRequested({ feature: 'suite-sync', isFeatureBeingDisabled: true }),
            );

            expect(state.usageCounts['suite-sync']).toBeUndefined();
            expect(state.pendingFeedbackFeatures).toContain('suite-sync');
        });

        it('preserves usage count when isFeatureBeingDisabled is false', () => {
            const stateWithCount = {
                ...initialState,
                usageCounts: { 'suite-sync': 2 as const },
            };

            const state = experimentalFeedbackReducer(
                stateWithCount,
                feedbackRequested({ feature: 'suite-sync', isFeatureBeingDisabled: false }),
            );

            expect(state.usageCounts['suite-sync']).toBe(2);
        });

        it('preserves usage count when isFeatureBeingDisabled is omitted', () => {
            const stateWithCount = {
                ...initialState,
                usageCounts: { 'suite-sync': 2 as const },
            };

            const state = experimentalFeedbackReducer(
                stateWithCount,
                feedbackRequested({ feature: 'suite-sync' }),
            );

            expect(state.usageCounts['suite-sync']).toBe(2);
        });
    });

    describe(feedbackDismissed.name, () => {
        it('removes feature from pendingFeedbackFeatures', () => {
            const stateWithPending = {
                ...initialState,
                pendingFeedbackFeatures: ['suite-sync' as const],
            };

            const state = experimentalFeedbackReducer(
                stateWithPending,
                feedbackDismissed('suite-sync'),
            );

            expect(state.pendingFeedbackFeatures).not.toContain('suite-sync');
        });

        it('is a no-op when feature is not pending', () => {
            const state = experimentalFeedbackReducer(
                initialState,
                feedbackDismissed('suite-sync'),
            );

            expect(state.pendingFeedbackFeatures).toEqual([]);
        });

        it('removes only the target feature when multiple are pending', () => {
            const stateWithPending = {
                ...initialState,
                pendingFeedbackFeatures: ['suite-sync' as const, 'nft-section' as const],
            };

            const state = experimentalFeedbackReducer(
                stateWithPending,
                feedbackDismissed('suite-sync'),
            );

            expect(state.pendingFeedbackFeatures).not.toContain('suite-sync');
            expect(state.pendingFeedbackFeatures).toContain('nft-section');
        });
    });
});
