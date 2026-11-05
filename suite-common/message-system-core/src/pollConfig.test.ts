import { FETCH_INTERVAL_IN_MS, FETCH_INTERVAL_IN_MS_MOBILE } from './constants';
import { isConfigFetchDue } from './pollConfig';

const now = Date.parse('2026-06-01T00:00:00+00:00');

describe('isConfigFetchDue', () => {
    beforeEach(() => {
        jest.spyOn(Date, 'now').mockImplementation(() => now);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('waits for the fetch interval of the platform to elapse', () => {
        const isDue = (lastFetchTimestamp: number, isMobile: boolean) =>
            isConfigFetchDue({ isLocalConfig: false, lastFetchTimestamp, isMobile });

        expect(isDue(now - FETCH_INTERVAL_IN_MS, false)).toBe(true);
        expect(isDue(now - FETCH_INTERVAL_IN_MS + 1, false)).toBe(false);
        expect(isDue(now - FETCH_INTERVAL_IN_MS_MOBILE, true)).toBe(true);
        expect(isDue(now - FETCH_INTERVAL_IN_MS, true)).toBe(false);
    });

    it('is always due for the bundled local config, which is not fetched at all', () => {
        expect(
            isConfigFetchDue({ isLocalConfig: true, lastFetchTimestamp: now, isMobile: false }),
        ).toBe(true);
    });
});
