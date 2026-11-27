import { setFlagsFromString } from 'node:v8';
import { runInNewContext } from 'node:vm';

import { BigNumber } from './bigNumber';
import { createStableBigNumbers } from './createStableBigNumbers';

setFlagsFromString('--expose-gc');
const collectGarbage = runInNewContext('gc') as () => void;

// A WeakRef target stays alive until the job that created the WeakRef ends.
const collectGarbageAfterCurrentJob = async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
    collectGarbage();
};

describe('createStableBigNumbers', () => {
    it('returns the first instance for every equal value', () => {
        const getStable = createStableBigNumbers<BigNumber>();
        const first = new BigNumber('1.5');

        expect(getStable(first)).toBe(first);
        expect(getStable(new BigNumber('1.50'))).toBe(first);
        expect(getStable(new BigNumber(1.5))).toBe(first);
    });

    it('returns different instances for different values', () => {
        const getStable = createStableBigNumbers<BigNumber>();
        const one = new BigNumber(1);
        const two = new BigNumber(2);

        expect(getStable(one)).toBe(one);
        expect(getStable(two)).toBe(two);
        expect(getStable(new BigNumber(1))).toBe(one);
    });

    it('does not share instances between caches', () => {
        const getStableA = createStableBigNumbers<BigNumber>();
        const getStableB = createStableBigNumbers<BigNumber>();
        const fromA = getStableA(new BigNumber(1));
        const fromB = new BigNumber(1);

        expect(getStableB(fromB)).toBe(fromB);
        expect(getStableA(new BigNumber(1))).toBe(fromA);
    });

    it('does not keep released values alive', async () => {
        const getStable = createStableBigNumbers<BigNumber>();
        const released = new WeakRef(getStable(new BigNumber(1)));

        await collectGarbageAfterCurrentJob();

        expect(released.deref()).toBeUndefined();
        const replacement = new BigNumber(1);
        expect(getStable(replacement)).toBe(replacement);
    });

    it('drops the entries of released values and keeps the held ones', async () => {
        const getStable = createStableBigNumbers<BigNumber>();
        const held = getStable(new BigNumber(1000));
        const releasedKeys = Array.from({ length: 63 }, (_, index) => `${index}.5`);
        releasedKeys.forEach(key => getStable(new BigNumber(key)));

        await collectGarbageAfterCurrentJob();

        const deleteSpy = jest.spyOn(Map.prototype, 'delete');
        // The 65th entry exceeds the minimum sweep size and triggers the sweep.
        getStable(new BigNumber(-1));
        const deletedKeys = deleteSpy.mock.calls.map(([key]) => key);
        deleteSpy.mockRestore();

        expect(deletedKeys).toEqual(expect.arrayContaining(releasedKeys));
        expect(deletedKeys).not.toContain('1000');
        expect(getStable(new BigNumber(1000))).toBe(held);
    });
});
