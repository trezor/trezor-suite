import { AbortablePromise, AbortError } from '../src/abortablePromise';

describe('AbortablePromise', () => {
    test('resolves', async () => {
        const a = new AbortablePromise(resolve => {
            setTimeout(() => {
                resolve('done');
            }, 1);
        });

        await expect(a).resolves.toEqual('done');
    });

    test('rejects', async () => {
        const a = new AbortablePromise((_resolve, reject) => {
            setTimeout(() => {
                reject('failed');
            }, 1);
        });

        await expect(a).rejects.toEqual('failed');
    });

    test('abort from outside', () => {
        const a = new AbortablePromise(resolve => {
            setTimeout(() => {
                resolve('failed');
            }, 1);
        });
        a.abort('custom err');

        expect(a).rejects.toBeInstanceOf(AbortError);
    });

    test('abort listener aborts another promise', () => {
        const b = new AbortablePromise(resolve => {
            setTimeout(() => {
                resolve('success');
            });
        });

        const a = new AbortablePromise((resolve, _reject, abortsignal) => {
            setTimeout(() => {
                resolve('failed');
            }, 1);
            abortsignal.addEventListener('abort', () => {
                b.abort();
            });
        });

        a.abort();

        expect(a).rejects.toBeInstanceOf(AbortError);
        expect(b).rejects.toBeInstanceOf(AbortError);
    });

    test('abort from parent controller', () => {
        const controller = new AbortController();

        const a = new AbortablePromise(resolve => {
            setTimeout(() => {
                resolve('mew');
            }, 1);
        }, controller);

        controller.abort();
        expect(a).rejects.toBeInstanceOf(AbortError);
    });
});
