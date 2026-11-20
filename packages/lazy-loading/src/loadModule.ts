import { type Result, err, ok } from '@trezor/type-utils';

import { LazyLoadingError } from './lazyLoadingError';

const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : String(error);

/**
 * Runs a lazy import and returns its result instead of rejecting, so a failed download
 * becomes a `LazyLoadingError` the caller handles like any other error.
 * Pick the export inside the import, as in `import('./module').then(({ value }) => value)`:
 * a returned module object keeps all of the module's exports in its chunk.
 */
export const loadModule = async <TModule>(
    importModule: () => Promise<TModule>,
): Promise<Result<TModule, LazyLoadingError>> => {
    try {
        return ok(await importModule());
    } catch (error) {
        const lazyLoadingError = LazyLoadingError(getErrorMessage(error));

        // A failed download is an expected network condition: warn, as errors go to Sentry.
        console.warn(`Lazy loading failed: ${lazyLoadingError.message}`);

        return err(lazyLoadingError);
    }
};
