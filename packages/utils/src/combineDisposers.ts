export type Disposer = () => void;

/**
 * Compose multiple disposers into a single idempotent disposer.
 * Disposers run in reverse order (LIFO) so cleanup mirrors the order of acquisition.
 * Errors thrown by individual disposers are collected and re-thrown as an AggregateError
 * after all disposers have been attempted.
 */
export const combineDisposers = (...disposers: Disposer[]): Disposer => {
    let disposed = false;

    return () => {
        if (disposed) return;
        disposed = true;

        const errors: unknown[] = [];
        for (let i = disposers.length - 1; i >= 0; i--) {
            try {
                disposers[i]?.();
            } catch (error) {
                errors.push(error);
            }
        }

        if (errors.length === 1) {
            throw errors[0];
        }
        if (errors.length > 1) {
            throw new AggregateError(errors, 'combineDisposers: multiple disposers threw');
        }
    };
};
