type Logger = {
    debug: (...args: unknown[]) => void;
};

export const getLogger = (debug: boolean): Logger => {
    const label = '@trezor/network-cardano-coin-selection';

    return {
        debug: (...args) => {
            if (!debug) return;

            // eslint-disable-next-line no-console
            console.log(`[${label}] DEBUG:`, ...args);
        },
    };
};
