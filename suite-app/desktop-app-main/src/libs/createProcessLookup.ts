import type { Socket } from 'net';

import type { ProcessInfo, findProcessFromIncomingPort } from '@trezor/node-utils';
import { RejectWhenAbortedError, ScheduleActionTimeoutError, scheduleAction } from '@trezor/utils';

import type { ILogger } from './logger';

const LOG_PREFIX = 'process-lookup';

export type ProcessLookupDeps = {
    findProcessFromIncomingPort: typeof findProcessFromIncomingPort;
    logger: Pick<ILogger, 'error'>;
};

export type ProcessLookupParams = {
    port: number;
    /** The server side of the accepted connection, e.g. `req.socket`. */
    connection: Pick<Socket, 'remoteAddress' | 'remotePort' | 'localAddress' | 'localPort'>;
    shouldFilterSelf: boolean;
    /** Deadline of a lookup, in which the wait for its turn is counted. */
    timeoutMs: number;
    /** A lookup that ran and found no process runs again no sooner than this after it settled. */
    retryIntervalMs: number;
};

export type ProcessLookup = (params: ProcessLookupParams) => {
    /**
     * Resolves with the process holding the client end of the connection, or `undefined` when there
     * is none or the lookup failed: it never rejects. The process holding the client end of a
     * connection is the same for as long as the connection lasts, so the lookup runs once and every
     * later call shares it, one that arrives while it still runs included. A lookup that ran and
     * found nothing runs again, but not before the retry interval has passed. One that failed or
     * timed out learned nothing, so the next call after it looks again at once. A failure that is
     * not transient, such as a host without lsof, therefore costs a failed attempt per call, and
     * this service does not bound that.
     */
    lookUp: () => Promise<ProcessInfo | undefined>;
    /**
     * Stops the running lookup, killing its commands, once nobody is left to use the result. No
     * lookup starts after that: `lookUp` resolves with no process.
     */
    abort: () => void;
};

export const createProcessLookup =
    (deps: ProcessLookupDeps): ProcessLookup =>
    params => {
        let lookup: Promise<ProcessInfo | undefined> | undefined;
        let lookupMissedAt: number | undefined;
        let abortRunningLookup: (() => void) | undefined;
        let isAborted = false;

        const runLookup = () => {
            const callerAbort = new AbortController();
            abortRunningLookup = () => callerAbort.abort();

            return scheduleAction(
                signal =>
                    deps.findProcessFromIncomingPort(
                        params.port,
                        params.shouldFilterSelf,
                        params.connection,
                        signal,
                    ),
                // The lookup has a safety timeout of its own, but a longer one, so a caller never
                // waits longer than this deadline. The deadline also covers the wait for a free
                // lookup slot. A deadline, like an abort, kills the commands of the lookup.
                { timeout: params.timeoutMs, signal: callerAbort.signal },
            );
        };

        const reportFailure = (error: unknown) => {
            if (error instanceof ScheduleActionTimeoutError) {
                deps.logger.error(LOG_PREFIX, 'findProcessFromIncomingPort timed out');
            } else if (!(error instanceof RejectWhenAbortedError)) {
                // An abort is the caller giving up, so it is not worth a report.
                deps.logger.error(LOG_PREFIX, `findProcessFromIncomingPort failed: ${error}`);
            }
        };

        const lookUp = () => {
            // Nobody is left to use the result, and nobody would stop a lookup started now.
            if (isAborted) {
                return Promise.resolve(undefined);
            }

            const isRetryDue =
                lookupMissedAt !== undefined &&
                Date.now() - lookupMissedAt >= params.retryIntervalMs;

            if (!lookup || isRetryDue) {
                lookupMissedAt = undefined;
                lookup = runLookup().then(
                    foundProcess => {
                        // The lookup ran and found nothing, which a client that runs sandboxed
                        // on Linux does every time, so it is not repeated at once.
                        if (!foundProcess) {
                            lookupMissedAt = Date.now();
                        }

                        return foundProcess;
                    },
                    error => {
                        reportFailure(error);
                        // A lookup that failed or timed out learned nothing, and could succeed
                        // next time. Where a missing process refuses the call, waiting out the
                        // retry interval would refuse the calls of that whole time. A failure that
                        // is not transient, such as a host without lsof, costs a failed attempt on
                        // every call, which only the budget of the caller and the cap on concurrent
                        // lookups bound.
                        lookup = undefined;

                        return undefined;
                    },
                );
            }

            return lookup;
        };

        const abort = () => {
            isAborted = true;
            abortRunningLookup?.();
        };

        return { lookUp, abort };
    };
