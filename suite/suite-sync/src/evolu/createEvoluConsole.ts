import {
    type Console,
    createConsole,
    createConsoleFormatter,
    createConsoleStoreOutput,
} from '@evolu/common';
import { consoleEntryOrErrorBroadcastChannelName } from '@evolu/common/local-first';

import { type UpdateRelayConnectionStatus } from '@suite-common/suite-sync';
import { exhaustive } from '@trezor/type-utils';
import { isArrayMember } from '@trezor/utils';

const evoluWebSocketEventNames = [
    'webSocketCreated',
    'webSocketDestroyed',
    'webSocketOpen',
    'webSocketClose',
    'webSocketError',
] as const;

type EvoluWebSocketEventName = (typeof evoluWebSocketEventNames)[number];

export type EvoluConsoleDeps = {
    updateRelayConnectionStatus: UpdateRelayConnectionStatus;
};

const isEvoluWebSocketEventName = (value: unknown): value is EvoluWebSocketEventName =>
    typeof value === 'string' && isArrayMember(value, evoluWebSocketEventNames);

const getErrorMessage = (value: unknown): string | undefined => {
    if (typeof value === 'undefined') return undefined;

    return JSON.stringify(value);
};

export const createEvoluConsole = (deps: EvoluConsoleDeps): Console => {
    const evoluConsoleStoreOutput = createConsoleStoreOutput();
    const console = createConsole({
        level: 'debug',
        output: evoluConsoleStoreOutput,
        formatter: createConsoleFormatter()({ timestampFormat: 'absolute' }),
    });
    const broadcastChannel = new BroadcastChannel(consoleEntryOrErrorBroadcastChannelName);

    broadcastChannel.onmessage = ({ data }) => {
        if (typeof data !== 'object' || data === null || !('type' in data)) return;
        if (data.type !== 'ConsoleEntry' || !('entry' in data)) return;

        const { entry } = data;

        if (typeof entry !== 'object' || entry === null || !('args' in entry)) return;
        if (!Array.isArray(entry.args)) return;

        const [eventName, eventData] = entry.args;

        if (!isEvoluWebSocketEventName(eventName)) return;
        if (typeof eventData !== 'object' || eventData === null || !('url' in eventData)) return;
        if (typeof eventData.url !== 'string') return;

        switch (eventName) {
            case 'webSocketCreated':
                deps.updateRelayConnectionStatus({ type: 'add', url: eventData.url });
                break;

            case 'webSocketDestroyed':
                deps.updateRelayConnectionStatus({ type: 'remove', url: eventData.url });
                break;

            case 'webSocketOpen':
                deps.updateRelayConnectionStatus({ type: 'connect', url: eventData.url });
                break;

            case 'webSocketClose':
                deps.updateRelayConnectionStatus({ type: 'disconnect', url: eventData.url });
                break;

            case 'webSocketError':
                deps.updateRelayConnectionStatus({
                    type: 'error',
                    url: eventData.url,
                    errorMessage: getErrorMessage(
                        'error' in eventData ? eventData.error : undefined,
                    ),
                });
                break;

            default:
                exhaustive(eventName);
        }
    };

    return console;
};
