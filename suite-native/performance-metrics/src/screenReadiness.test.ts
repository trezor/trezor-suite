import {
    useIsAccountsScreenReady,
    useIsHomeScreenReady,
    useIsReceiveScreenReady,
} from './screenReadiness';

describe('screen readiness outside a Detox test build', () => {
    it('never reports a screen as ready, so production does not subscribe to the store', () => {
        expect(useIsHomeScreenReady()).toBe(false);
        expect(useIsAccountsScreenReady()).toBe(false);
        expect(useIsReceiveScreenReady(undefined)).toBe(false);
    });
});
