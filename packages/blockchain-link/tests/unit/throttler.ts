import { Throttler } from '../../src/workers/throttler';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const DELAY_MS = 10;
const THROTTLE_MS = 50;

describe('Throttler', () => {
    let throttler: Throttler;
    let results: string[];

    const getParams = (id: string) => [id, () => results.push(id)] as const;

    beforeEach(() => {
        throttler = new Throttler(THROTTLE_MS);
        results = [];
    });

    afterEach(() => {
        throttler.dispose();
    });

    it('normal', async () => {
        throttler.throttle(...getParams('a'));
        await delay(DELAY_MS);
        throttler.throttle(...getParams('b'));
        await delay(THROTTLE_MS + DELAY_MS);
        expect(results).toStrictEqual(['a', 'b']);
    });

    it('repeated', async () => {
        throttler.throttle(...getParams('a'));
        await delay(THROTTLE_MS);
        throttler.throttle(...getParams('a'));
        await delay(THROTTLE_MS + DELAY_MS);
        expect(results).toStrictEqual(['a', 'a']);
    });

    it('override', async () => {
        throttler.throttle(...getParams('a'));
        await delay(DELAY_MS);
        throttler.throttle(...getParams('b'));
        await delay(DELAY_MS);
        throttler.throttle(...getParams('a'));
        await delay(THROTTLE_MS + DELAY_MS);
        expect(results).toStrictEqual(['b', 'a']);
    });

    it('cancel', async () => {
        throttler.throttle(...getParams('a'));
        await delay(DELAY_MS);
        throttler.throttle(...getParams('b'));
        await delay(DELAY_MS);
        throttler.cancel('a');
        await delay(THROTTLE_MS + DELAY_MS);
        expect(results).toStrictEqual(['b']);
    });

    it('dispose', async () => {
        throttler.throttle(...getParams('a'));
        await delay(DELAY_MS);
        throttler.throttle(...getParams('b'));
        await delay(DELAY_MS);
        throttler.dispose();
        await delay(THROTTLE_MS + DELAY_MS);
        expect(results).toStrictEqual([]);
    });
});
