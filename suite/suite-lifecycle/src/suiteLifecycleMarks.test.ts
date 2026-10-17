import {
    SuiteLifecycleMark,
    getSuiteLifecycleMarkTime,
    getSuiteLifecycleMarkTimes,
    markSuiteLifecycle,
} from './suiteLifecycleMarks';

describe('suite lifecycle marks', () => {
    afterEach(() => {
        performance.clearMarks();
    });

    it('reads null before a step was marked', () => {
        expect(getSuiteLifecycleMarkTimes()).toEqual({
            'suite:init': null,
            'suite:ready': null,
            'suite:interactive': null,
        });
    });

    it('marks a step and keeps the first time of a step marked twice', () => {
        markSuiteLifecycle(SuiteLifecycleMark.Init);
        const first = getSuiteLifecycleMarkTime(SuiteLifecycleMark.Init);

        expect(first).toEqual(expect.any(Number));

        markSuiteLifecycle(SuiteLifecycleMark.Init);

        expect(getSuiteLifecycleMarkTime(SuiteLifecycleMark.Init)).toBe(first);
        expect(getSuiteLifecycleMarkTimes()).toEqual({
            'suite:init': first,
            'suite:ready': null,
            'suite:interactive': null,
        });
    });
});
