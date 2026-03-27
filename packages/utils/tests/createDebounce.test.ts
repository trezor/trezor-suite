import { createDebounce } from '../src/createDebounce';

const DEBOUNCE_MS = 300;

describe('createDebounce', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('calls fn after delay', () => {
        const debounce = createDebounce(DEBOUNCE_MS);
        const fn = jest.fn();

        debounce(fn);
        expect(fn).not.toHaveBeenCalled();

        jest.advanceTimersByTime(DEBOUNCE_MS);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('resets timer on repeated calls, only fires once', () => {
        const debounce = createDebounce(DEBOUNCE_MS);
        const fn = jest.fn();

        debounce(fn);
        jest.advanceTimersByTime(DEBOUNCE_MS - 1);
        debounce(fn);
        jest.advanceTimersByTime(DEBOUNCE_MS - 1);
        debounce(fn);

        expect(fn).not.toHaveBeenCalled();

        jest.advanceTimersByTime(DEBOUNCE_MS);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('calls the latest fn passed', () => {
        const debounce = createDebounce(DEBOUNCE_MS);
        const fn1 = jest.fn();
        const fn2 = jest.fn();

        debounce(fn1);
        jest.advanceTimersByTime(DEBOUNCE_MS - 1);
        debounce(fn2);
        jest.advanceTimersByTime(DEBOUNCE_MS);

        expect(fn1).not.toHaveBeenCalled();
        expect(fn2).toHaveBeenCalledTimes(1);
    });

    it('fires again after delay has elapsed', () => {
        const debounce = createDebounce(DEBOUNCE_MS);
        const fn = jest.fn();

        debounce(fn);
        jest.advanceTimersByTime(DEBOUNCE_MS);
        expect(fn).toHaveBeenCalledTimes(1);

        debounce(fn);
        jest.advanceTimersByTime(DEBOUNCE_MS);
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('independent instances do not interfere', () => {
        const debounceA = createDebounce(DEBOUNCE_MS);
        const debounceB = createDebounce(DEBOUNCE_MS);
        const fnA = jest.fn();
        const fnB = jest.fn();

        debounceA(fnA);
        debounceB(fnB);
        jest.advanceTimersByTime(DEBOUNCE_MS);

        expect(fnA).toHaveBeenCalledTimes(1);
        expect(fnB).toHaveBeenCalledTimes(1);
    });
});
