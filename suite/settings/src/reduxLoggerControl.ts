export type ReduxLoggerControl = {
    /** Loads redux-logger on the first call and lets it log every action with both states. */
    enable: () => Promise<void>;
    disable: () => void;
    isEnabled: () => boolean;
};

export type ReduxLoggerControlDep = { reduxLoggerControl?: ReduxLoggerControl };

export const injectReduxLoggerControl = (
    services: ReduxLoggerControlDep,
): ReduxLoggerControlDep => ({
    reduxLoggerControl: services.reduxLoggerControl,
});
