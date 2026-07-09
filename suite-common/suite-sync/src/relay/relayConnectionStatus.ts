import { type WithSuiteSyncState } from '../suiteSyncSlice';

export type SuiteSyncRelayConnection = {
    state: 'connected' | 'disconnected';
    url: string;
};

export type SuiteSyncRelayConnectionLogEntry = {
    state: 'connected' | 'disconnected' | 'error';
    timestamp: number;
    url: string;
    errorMessage?: string;
};

export type SuiteSyncRelayConnectionEvent =
    | {
          type: 'add';
          url: string;
      }
    | {
          type: 'remove';
          url: string;
      }
    | {
          type: 'status';
          connection: SuiteSyncRelayConnectionLogEntry;
      };

type EvoluConsoleEntry = {
    method: string;
    args: ReadonlyArray<unknown>;
    path?: ReadonlyArray<unknown>;
};

const EVOLU_RELAY_CONNECTED_MESSAGES = new Set(['transportOpen', 'webSocketOpen']);

const EVOLU_RELAY_CREATED_MESSAGES = new Set(['webSocketCreated']);

const EVOLU_RELAY_DISCONNECTED_MESSAGES = new Set(['webSocketClose']);

const EVOLU_RELAY_ERROR_MESSAGES = new Set(['webSocketError']);

const EVOLU_RELAY_OWNER_MESSAGES = new Set(['useOwner']);

export const selectSuiteSyncRelayConnections = (state: WithSuiteSyncState) =>
    state.suiteSync.relayConnections;

export const selectSuiteSyncRelayConnectionLog = (state: WithSuiteSyncState) =>
    state.suiteSync.relayConnectionLog;

const sanitizeEvoluTransportUrl = (url: string) => {
    try {
        const parsedUrl = new URL(url);

        parsedUrl.search = '';
        parsedUrl.hash = '';

        return parsedUrl.toString();
    } catch {
        return url.split('?')[0] ?? url;
    }
};

const getErrorMessage = (data: object) => {
    if (!('error' in data)) return undefined;

    const { error } = data;

    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (typeof error === 'object' && error !== null && 'message' in error) {
        const { message } = error;

        if (typeof message === 'string') return message;
    }

    return undefined;
};

const getSuiteSyncRelayConnectionLogState = (message: string) => {
    if (EVOLU_RELAY_CONNECTED_MESSAGES.has(message)) return 'connected';
    if (EVOLU_RELAY_ERROR_MESSAGES.has(message)) return 'error';

    return 'disconnected';
};

const getEvoluConsoleMessageAndData = (entry: EvoluConsoleEntry) => {
    const [firstArg, secondArg] = entry.args;

    if (typeof firstArg === 'string') {
        return {
            message: firstArg,
            data: secondArg,
        };
    }

    const pathMessage = entry.path
        ?.slice()
        .reverse()
        .find(
            pathPart =>
                typeof pathPart === 'string' &&
                (EVOLU_RELAY_CONNECTED_MESSAGES.has(pathPart) ||
                    EVOLU_RELAY_CREATED_MESSAGES.has(pathPart) ||
                    EVOLU_RELAY_DISCONNECTED_MESSAGES.has(pathPart) ||
                    EVOLU_RELAY_ERROR_MESSAGES.has(pathPart) ||
                    EVOLU_RELAY_OWNER_MESSAGES.has(pathPart)),
        );

    if (typeof pathMessage !== 'string') return null;

    return {
        message: pathMessage,
        data: firstArg,
    };
};

export const getSuiteSyncRelayConnectionFromEvoluLog = (
    entry: EvoluConsoleEntry,
): SuiteSyncRelayConnectionEvent[] => {
    if (entry.method !== 'debug' && entry.method !== 'info') return [];

    const messageAndData = getEvoluConsoleMessageAndData(entry);

    if (!messageAndData) return [];

    const { message, data } = messageAndData;

    if (EVOLU_RELAY_OWNER_MESSAGES.has(message)) {
        if (typeof data !== 'object' || data === null) return [];
        if (!('action' in data)) return [];
        const { action } = data;

        if (action !== 'add' && action !== 'remove') return [];
        if (!('transportUrls' in data) || !Array.isArray(data.transportUrls)) return [];

        return data.transportUrls.flatMap(url => {
            if (typeof url !== 'string') return [];

            return {
                type: action,
                url: sanitizeEvoluTransportUrl(url),
            } satisfies SuiteSyncRelayConnectionEvent;
        });
    }

    if (
        !EVOLU_RELAY_CONNECTED_MESSAGES.has(message) &&
        !EVOLU_RELAY_CREATED_MESSAGES.has(message) &&
        !EVOLU_RELAY_DISCONNECTED_MESSAGES.has(message) &&
        !EVOLU_RELAY_ERROR_MESSAGES.has(message)
    ) {
        return [];
    }

    if (typeof data !== 'object' || data === null || !('url' in data)) return [];

    const { url } = data;

    if (typeof url !== 'string') return [];

    const connection = {
        state: getSuiteSyncRelayConnectionLogState(message),
        url: sanitizeEvoluTransportUrl(url),
        timestamp: Date.now(),
        errorMessage: getErrorMessage(data),
    } satisfies SuiteSyncRelayConnectionLogEntry;

    if (EVOLU_RELAY_CREATED_MESSAGES.has(message)) {
        return [
            {
                type: 'add',
                url: connection.url,
            },
            {
                type: 'status',
                connection,
            },
        ];
    }

    return [
        {
            type: 'status',
            connection,
        },
    ];
};
