// Section 4.1.10. Status events in https://gitweb.torproject.org/torspec.git/tree/control-spec.txt

import type { BootstrapEvent } from '../types';

const clientStatusGroupParser = (message: string): RegExpMatchArray | null =>
    message.trim().match(/^(^650 STATUS_CLIENT NOTICE BOOTSTRAP PROGRESS=.*)+/gm);

const statusParser = (status: string): RegExpMatchArray | null =>
    status.trim().match(/^650 STATUS_CLIENT NOTICE BOOTSTRAP (PROGRESS=(?<progress>\d+)?.*)?/);

export const bootstrapParser = (message: string): BootstrapEvent[] => {
    const clientStatusGroups = clientStatusGroupParser(message);
    if (!clientStatusGroups) {
        return [];
    }

    return clientStatusGroups.map(clientStatus => {
        const clientStatusParsed = statusParser(clientStatus);
        return {
            progress: clientStatusParsed?.groups?.progress ?? '',
        };
    });
};

export enum BootstrapEventProgress {
    Done = '100',
}
