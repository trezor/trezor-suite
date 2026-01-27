import { selectHasUserAllowedTracking, selectIsAnalyticsEnabled } from '../analyticsReducer';
import type { AnalyticsState } from '../analyticsReducer';

type RootState = {
    analytics: AnalyticsState;
};

describe('analyticsSelectors', () => {
    describe('selectHasUserAllowedTracking', () => {
        it('should return undefined when analytics is not confirmed', () => {
            const state: RootState = {
                analytics: {
                    confirmed: false,
                    enabled: true,
                },
            };
            expect(selectHasUserAllowedTracking(state)).toBeUndefined();
        });

        it('should return true when analytics is confirmed and enabled', () => {
            const state: RootState = {
                analytics: {
                    confirmed: true,
                    enabled: true,
                },
            };
            expect(selectHasUserAllowedTracking(state)).toBe(true);
        });

        it('should return false when analytics is confirmed but disabled', () => {
            const state: RootState = {
                analytics: {
                    confirmed: true,
                    enabled: false,
                },
            };
            expect(selectHasUserAllowedTracking(state)).toBe(false);
        });

        it('should return false when analytics is confirmed but enabled is undefined', () => {
            const state: RootState = {
                analytics: {
                    confirmed: true,
                    enabled: undefined,
                },
            };
            expect(selectHasUserAllowedTracking(state)).toBe(false);
        });
    });

    describe('selectIsAnalyticsEnabled', () => {
        it('should return false when analytics is not confirmed', () => {
            const state: RootState = {
                analytics: {
                    confirmed: false,
                    enabled: true,
                },
            };
            expect(selectIsAnalyticsEnabled(state)).toBe(false);
        });

        it('should return true when analytics is confirmed and enabled', () => {
            const state: RootState = {
                analytics: {
                    confirmed: true,
                    enabled: true,
                },
            };
            expect(selectIsAnalyticsEnabled(state)).toBe(true);
        });

        it('should return false when analytics is confirmed but disabled', () => {
            const state: RootState = {
                analytics: {
                    confirmed: true,
                    enabled: false,
                },
            };
            expect(selectIsAnalyticsEnabled(state)).toBe(false);
        });

        it('should return false when analytics is confirmed but enabled is undefined', () => {
            const state: RootState = {
                analytics: {
                    confirmed: true,
                    enabled: undefined,
                },
            };
            expect(selectIsAnalyticsEnabled(state)).toBe(false);
        });
    });
});
