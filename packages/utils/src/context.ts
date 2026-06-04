/**
 * Creates a context that can be shared across different parts of the application. It allows setting a context value and retrieving it asynchronously. If the context value is not set when `getContext` is called, it will wait until the context is set before resolving.
 *
 * Example usage:
 *
 * ```typescript
 * const baseUrlContext = createContext<string>();
 *
 * // Somewhere in the application
 * baseUrlContext.get().then(ctx => {
 *     console.log(ctx); // Outputs: "https://my-api.com"
 * });
 *
 * // Later, somewhere else in the application
 * baseUrlContext.set("https://my-api.com");
 * ```
 *
 * E.g. as part of interface of a general module (e.g. in suite-common) that can be shared across different environments (e.g. web, mobile). It effectively prevents circular dependencies and race-conditions.
 */
export function createContext<T>() {
    let context: T | null = null;
    const getContextTasks = new Set<(ctx: T) => void>();

    function reset() {
        context = null;
        getContextTasks.clear();
    }

    function set(ctx: T) {
        context = typeof ctx === 'object' ? Object.assign(context || {}, ctx) : ctx;

        getContextTasks.forEach(resolve => {
            resolve(ctx);
        });

        getContextTasks.clear();
    }

    async function get() {
        if (context) {
            return context;
        }

        return await new Promise<T>(resolve => {
            getContextTasks.add(resolve);
        });
    }

    return { set, get, reset } as const;
}
