/**
 * @jest-environment jsdom
 */
import { renderHook } from '@suite-common/test-utils';

import { useStakingDaysUntil } from './useStakingDaysUntil';

const NOW = 1_800_000_000_000;
const DAY_MS = 24 * 60 * 60 * 1000;

describe('useStakingDaysUntil', () => {
    beforeEach(() => {
        jest.useFakeTimers({ now: NOW });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('counts the days until a time ahead', () => {
        expect(renderHook(() => useStakingDaysUntil(NOW + 3 * DAY_MS)).result.current).toBe(3);
    });

    it('knows no day count without a time', () => {
        expect(renderHook(() => useStakingDaysUntil(null)).result.current).toBeNull();
    });
});
