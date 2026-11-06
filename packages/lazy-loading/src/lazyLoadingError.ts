/**
 * A lazily loaded module failed to download or start. It is technical:
 * the user can only reload or restart the app, and contact support when it keeps happening.
 */
export type LazyLoadingError = { type: 'LazyLoadingError'; message: string };

export const LazyLoadingError = (message: string): LazyLoadingError => ({
    type: 'LazyLoadingError' as const,
    message,
});
