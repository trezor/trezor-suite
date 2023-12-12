import { Throttler } from '../../src/workers/throttler';

const delay = (ms: number) => jest.advanceTimersByTime(ms);

const DELAY_MS = 10;
const THROTTLE_MS = 50;

describe('Throttler', () => {
    let throttler: Throttler;
    let results: string[];

    jest.useFakeTimers();

    const getParams = (id: string) => [id, () => results.push(id)] as const;

    beforeEach(() => {
        throttler = new Throttler(THROTTLE_MS);
        results = [];
    });

    afterEach(() => {
        throttler.dispose();
    });

    it('normal', () => {
        throttler.throttle(...getParams('a'));
        delay(DELAY_MS);
        throttler.throttle(...getParams('b'));
        delay(THROTTLE_MS + DELAY_MS);
        expect(results).toStrictEqual(['a', 'b']);
    });

    it('repeated', () => {
        throttler.throttle(...getParams('a'));
        delay(THROTTLE_MS);
        throttler.throttle(...getParams('a'));
        delay(THROTTLE_MS + DELAY_MS);
        expect(results).toStrictEqual(['a', 'a']);
    });

    it('delayed', () => {
        throttler.throttle(...getParams('a'));
        delay(DELAY_MS);
        throttler.throttle(...getParams('b'));
        delay(DELAY_MS);
        throttler.throttle(...getParams('a'));
        delay(DELAY_MS);
        throttler.throttle(...getParams('a'));
        delay(DELAY_MS);
        expect(results).toStrictEqual(['a', 'b']);
        delay(THROTTLE_MS);
        expect(results).toStrictEqual(['a', 'b', 'a']);
    });

    it('cancel', () => {
        throttler.throttle(...getParams('a'));
        delay(DELAY_MS);
        throttler.throttle(...getParams('b'));
        delay(DELAY_MS);
        throttler.throttle(...getParams('a'));
        delay(DELAY_MS);
        throttler.throttle(...getParams('b'));
        delay(DELAY_MS);
        throttler.cancel('a');
        delay(THROTTLE_MS);
        expect(results).toStrictEqual(['a', 'b', 'b']);
    });

    it('dispose', () => {
        throttler.throttle(...getParams('a'));
        delay(DELAY_MS);
        throttler.throttle(...getParams('b'));
        delay(DELAY_MS);
        throttler.throttle(...getParams('a'));
        delay(DELAY_MS);
        throttler.throttle(...getParams('b'));
        delay(DELAY_MS);
        throttler.dispose();
        delay(THROTTLE_MS);
        expect(results).toStrictEqual(['a', 'b']);
    });
});
