import { createExtendablePromise } from '../src/createExtendablePromise';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const deferred = () => {
    let resolve = () => {};

    const promise = new Promise<void>(res => {
        resolve = res;
    });

    return { promise, resolve };
};

describe('createExtendablePromise', () => {
    let extendablePromise: ReturnType<typeof createExtendablePromise<number>>;

    beforeEach(() => {
        extendablePromise = createExtendablePromise<number>();
    });

    it('wait without extend', async () => {
        const res = await extendablePromise.wait(42);
        expect(res).toEqual(42);
    });

    it('wait with synchronous extend', async () => {
        extendablePromise.extend(prev => Promise.resolve(prev + 3));
        extendablePromise.extend(prev => Promise.resolve(prev - 5));
        const res1 = await extendablePromise.wait(42);
        expect(res1).toEqual(40);

        extendablePromise.extend(prev => Promise.resolve(prev * 3));
        const res2 = await extendablePromise.wait(4);
        expect(res2).toEqual(12);
    });

    it('wait with asynchronous extend', async () => {
        const [first, second, third, fourth] = [deferred(), deferred(), deferred(), deferred()];

        delay(0).then(() => extendablePromise.extend(v => first.promise.then(() => v * 2)));
        delay(20).then(() => extendablePromise.extend(v => second.promise.then(() => v * 3)));
        // 30 - first wait call
        delay(50).then(() => first.resolve());
        delay(60).then(() => extendablePromise.extend(v => third.promise.then(() => v * 5)));
        delay(70).then(() => second.resolve());
        delay(110).then(() => third.resolve());
        // 110 - first wait call ends
        // 130 - second wait call, ends immediately
        delay(140).then(() => extendablePromise.extend(v => fourth.promise.then(() => v * 7)));
        // 160 - third wait call
        delay(190).then(() => fourth.resolve());
        // 190 - third wait call ends

        await delay(30);
        const result = await extendablePromise.wait(1);
        expect(result).toEqual(30);

        await delay(20);
        const result2 = await extendablePromise.wait(1);
        expect(result2).toEqual(1);

        await delay(30);
        const result3 = await extendablePromise.wait(1);
        expect(result3).toEqual(7);
    });
});
