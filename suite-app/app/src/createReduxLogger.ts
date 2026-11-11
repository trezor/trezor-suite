import { type Middleware, createDynamicMiddleware } from '@reduxjs/toolkit';

export type ReduxLoggerControl = {
    /** Loads redux-logger on the first call and lets it log every action with both states. */
    enable: () => Promise<void>;
    disable: () => void;
    isEnabled: () => boolean;
};

export type ReduxLoggerControlDep = { reduxLoggerControl?: ReduxLoggerControl };

export type ReduxLogger = { middleware: Middleware; control: ReduxLoggerControl };

export type ReduxLoggerStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

type ReduxLoggerDeps = {
    excludedActionTypes: string[];
    /** Keeps the switch across reloads; it is read before the store exists, so not Redux state. */
    reduxLoggerStorage: ReduxLoggerStorage;
    /** Forces the switch at start, over the stored value; CI sets it through the build. */
    isEnabledOverride?: boolean;
};

const STORAGE_KEY = 'redux-logger-enabled';

declare global {
    interface Window {
        /** Only non-codesign builds assemble it; call `window.reduxLogger.enable()` in DevTools. */
        reduxLogger?: ReduxLoggerControl;
    }
}

export const injectReduxLoggerControl = (
    services: ReduxLoggerControlDep,
): ReduxLoggerControlDep => ({
    reduxLoggerControl: services.reduxLoggerControl,
});

/**
 * Everything passed to console.* stays reachable while DevTools are attached, so logging every
 * action with both states grows memory for as long as the app runs. The logger therefore joins
 * the middleware chain only when a developer asks for it, through the Debug settings switch or
 * a global on window; until then the chain carries just the empty dynamic slot and the
 * redux-logger chunk is never loaded.
 */
export const createReduxLogger = (deps: ReduxLoggerDeps): ReduxLogger => {
    const dynamicMiddleware = createDynamicMiddleware();
    let isLogging = false;
    let loggerMiddlewareAdded: Promise<void> | undefined;

    const addLoggerMiddleware = async () => {
        const { createLogger } = await import(
            /* webpackChunkName: "redux-logger" */ 'redux-logger'
        );

        dynamicMiddleware.addMiddleware(
            createLogger({
                level: 'info',
                collapsed: true,
                predicate: (_getState, action) =>
                    isLogging &&
                    // Exclude generated lifecycle actions.
                    // https://redux-toolkit.js.org/api/createAsyncThunk#promise-lifecycle-actions
                    !action?.meta?.requestId &&
                    !deps.excludedActionTypes.includes(action.type),
            }),
        );
    };

    const startLogging = () => {
        isLogging = true;
        // A failed chunk load is forgotten so that the next call fetches the chunk again.
        loggerMiddlewareAdded ??= addLoggerMiddleware().catch((error: unknown) => {
            loggerMiddlewareAdded = undefined;
            throw error;
        });

        return loggerMiddlewareAdded;
    };

    const enable = () => {
        deps.reduxLoggerStorage.setItem(STORAGE_KEY, 'true');

        return startLogging();
    };

    const disable = () => {
        isLogging = false;
        deps.reduxLoggerStorage.removeItem(STORAGE_KEY);
    };

    const isEnabled = () => isLogging;

    const isEnabledAtStart =
        deps.isEnabledOverride ?? deps.reduxLoggerStorage.getItem(STORAGE_KEY) === 'true';

    if (isEnabledAtStart) {
        // Actions dispatched before the chunk arrives are not logged; nothing to do about that.
        startLogging().catch((error: unknown) => {
            console.warn('redux-logger could not be loaded', error);
        });
    }

    return {
        middleware: dynamicMiddleware.middleware as Middleware,
        control: { enable, disable, isEnabled },
    };
};
