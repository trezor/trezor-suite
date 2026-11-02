interface Logger {
    debug: (...args: unknown[]) => void;
}

type FormatParams = {
    level: string;
    args: unknown[];
    label: string;
    timestamp: string | undefined;
};

const myFormat = ({ level, args, label, timestamp }: FormatParams): unknown[] => {
    if (timestamp) {
        return [`${timestamp} [${label}] ${level}:`, ...args];
    }

    return [`[${label}] ${level}:`, ...args];
};

export const getLogger = (debug: boolean): Logger => {
    const label = '@trezor/network-cardano-coin-selection';

    return {
        debug: (...args) => {
            if (!debug) return;
            const formattedMessage = myFormat({
                level: 'DEBUG',
                args,
                // timestamp: new Date().toISOString(),
                timestamp: undefined,
                label,
            });

            // eslint-disable-next-line no-console
            console.log(...formattedMessage);
        },
    };
};
