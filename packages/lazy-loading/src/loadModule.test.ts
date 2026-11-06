import { err, ok } from '@trezor/type-utils';

import { LazyLoadingError } from './lazyLoadingError';
import { loadModule } from './loadModule';

describe(loadModule.name, () => {
    beforeEach(() => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('returns the loaded module', async () => {
        const loadedModule = { value: 'loaded' };

        const result = await loadModule(() => Promise.resolve(loadedModule));

        expect(result).toEqual(ok(loadedModule));
        expect(console.warn).not.toHaveBeenCalled();
    });

    it('returns a LazyLoadingError with the cause when the download fails', async () => {
        const result = await loadModule(() =>
            Promise.reject(new Error('Loading chunk 123 failed.')),
        );

        expect(result).toEqual(err(LazyLoadingError('Loading chunk 123 failed.')));
        expect(console.warn).toHaveBeenCalledWith('Lazy loading failed: Loading chunk 123 failed.');
    });

    it('returns a LazyLoadingError when starting the loaded module throws', async () => {
        const result = await loadModule(() =>
            Promise.resolve().then(() => {
                throw new Error('SharedWorker is blocked');
            }),
        );

        expect(result).toEqual(err(LazyLoadingError('SharedWorker is blocked')));
    });

    it('returns a LazyLoadingError when the import rejects with a non-error value', async () => {
        const result = await loadModule(() => Promise.reject('offline'));

        expect(result).toEqual(err(LazyLoadingError('offline')));
    });
});
