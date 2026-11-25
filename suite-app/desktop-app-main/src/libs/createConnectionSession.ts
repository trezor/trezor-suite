import type { Socket } from 'net';

import type { Manifest, PermissionRequest, PopupHandshake } from '@trezor/connect';
import { parseManifest, parseVersion } from '@trezor/connect-common/src/data/connectSettings';
import type { ProcessInfo } from '@trezor/node-utils';

import type { ProcessLookup } from './createProcessLookup';
import type { ILogger } from './logger';

const LOG_PREFIX = 'connect-ws';
export const HANDSHAKE_TIMEOUT_MS = 10000;
// The lookup behind a handshake is shared and capped, so a handshake costs little. This budget only
// keeps one connection from keeping the main process busy with them, so it is set well above what a
// client making calls needs: each call is one handshake plus a device round trip or a user
// confirmation. It is a generous ceiling, not one derived from a measurement.
export const HANDSHAKE_BURST = 20;
export const HANDSHAKE_REFILL_INTERVAL_MS = 100;

// Deadline of the process lookup run by the handshake. It is not the client's budget for the
// handshake itself: connect-web abandons that after 3 s, so a lookup slower than 3 s has already
// failed the call. This deadline only guarantees that the idle timeout is re-armed and that the
// child process of an abandoned lookup is killed.
export const PROCESS_LOOKUP_TIMEOUT_MS = 10000;
// A connection whose lookup ran and found no process looks again only after this pause. Such a
// client is never found when it runs sandboxed on Linux, so a retry on every handshake would only
// be work. A lookup that failed or timed out is not covered: it looks again on the next handshake.
export const PROCESS_LOOKUP_RETRY_INTERVAL_MS = 5000;
export const IDLE_CONNECTION_TIMEOUT_MS = 60000;

type CreateTokenBucketParams = {
    /** The most tokens the bucket holds, which is also what a new bucket starts with. */
    capacity: number;
    /** How long it takes to earn one token back. */
    refillIntervalMs: number;
};

/**
 * A rate limit that allows a burst of `capacity` and one more every `refillIntervalMs` after it.
 * Unlike a count per fixed window it has no boundary across which the allowance is doubled: in any
 * span of time it allows at most `capacity` plus what the span earns.
 */
const createTokenBucket = ({ capacity, refillIntervalMs }: CreateTokenBucketParams) => {
    let tokens = capacity;
    let refilledAt = Date.now();

    /** Takes a token and returns `true`, or returns `false` when the bucket is empty. */
    const tryTake = () => {
        const now = Date.now();
        // A clock that stepped back earns nothing, and is the new reference for what follows.
        const earnedTokens = Math.max(0, now - refilledAt) / refillIntervalMs;
        tokens = Math.min(capacity, tokens + earnedTokens);
        refilledAt = now;

        if (tokens < 1) {
            return false;
        }

        tokens -= 1;

        return true;
    };

    return { tryTake };
};

export type ConnectionSessionDeps = {
    logger: Pick<ILogger, 'info' | 'warn'>;
    processLookup: ProcessLookup;
};

export type ConnectionSessionParams = {
    ip?: string;
    port: number;
    /** What the connection says it comes from, for the log. */
    originKey: string;
    /**
     * The server side of the accepted connection, e.g. `req.socket`. The handshake destroys it when
     * there is nothing to reply to.
     */
    connection: Pick<
        Socket,
        'remoteAddress' | 'remotePort' | 'localAddress' | 'localPort' | 'destroy' | 'destroyed'
    >;
    /** Tells the client that its handshake went through. */
    sendHandshakeAck: (id: string) => void;
    /** Ends the connection of a client that went idle, in the way that is not an abnormal closure. */
    closeConnection: () => void;
    /** Whether a call of the client is still waiting for its answer. */
    hasPendingCalls: () => boolean;
};

export type HandshakeMessage = PopupHandshake & { id: string };

/** What the connection said about itself and what was found of its process. */
export type ConnectionContext = {
    manifest?: Manifest;
    version?: string;
    requestedPermissions?: PermissionRequest[];
    processOnPort?: ProcessInfo;
};

/**
 * What a Connect connection goes through between its accept and its close: the handshake that makes
 * it a known caller, within a deadline and a budget of attempts, and the idle timeout that releases
 * it once the client stops making calls.
 */
export type ConnectionSession = (params: ConnectionSessionParams) => {
    /**
     * Takes the handshake of the client. A handshake over the budget is dropped, and one without a
     * valid manifest closes the connection, both without a reply.
     */
    handleHandshake: (message: HandshakeMessage) => Promise<void>;
    /** Empty until the first handshake is acknowledged. */
    getContext: () => ConnectionContext;
    isHandshakeDone: () => boolean;
    /**
     * Releases the slot of a client that has stopped making calls, by closing its connection once
     * the idle timeout has passed, or starts that wait over. Pings do not restart it: the client
     * pings on its own, so the connection would never expire.
     */
    startIdleTimeout: () => void;
    /** Stops the idle timeout, which a call that waits for the user must not run into. */
    clearIdleTimeout: () => void;
    /**
     * Nobody is left to use the result: stops the deadline, the idle timeout and the lookup that may
     * still run.
     */
    dispose: () => void;
};

export const createConnectionSession =
    (deps: ConnectionSessionDeps): ConnectionSession =>
    params => {
        const peer = `${params.ip}:${params.port}`;
        const budget = createTokenBucket({
            capacity: HANDSHAKE_BURST,
            refillIntervalMs: HANDSHAKE_REFILL_INTERVAL_MS,
        });
        const lookup = deps.processLookup({
            port: params.port,
            connection: params.connection,
            shouldFilterSelf: !process.env.PLAYWRIGHT_RUN, // Ignore own process, unless testing.
            timeoutMs: PROCESS_LOOKUP_TIMEOUT_MS,
            retryIntervalMs: PROCESS_LOOKUP_RETRY_INTERVAL_MS,
        });
        let context: ConnectionContext = {};
        let _isHandshakeDone = false;
        let hasWarnedAboutHandshakes = false;
        let idleTimeout: ReturnType<typeof setTimeout> | undefined;

        const startIdleTimeout = () => {
            clearTimeout(idleTimeout);
            if (params.connection.destroyed) return;
            idleTimeout = setTimeout(() => {
                deps.logger.info(LOG_PREFIX, `connection closed: idle timeout from ${peer}`);
                params.closeConnection();
            }, IDLE_CONNECTION_TIMEOUT_MS);
        };

        const clearIdleTimeout = () => {
            clearTimeout(idleTimeout);
        };

        // Close connection if handshake is not received within timeout
        const deadline = setTimeout(() => {
            if (!_isHandshakeDone) {
                deps.logger.warn(LOG_PREFIX, `connection closed: handshake timeout from ${peer}`);
                params.connection.destroy();
            }
        }, HANDSHAKE_TIMEOUT_MS);

        const handleHandshake = async (message: HandshakeMessage) => {
            if (!budget.tryTake()) {
                // Dropped without a reply, because the client reads any reply to a handshake as its
                // ack. Its own 3 s timeout then fails the handshake, and its websocket client rejects
                // every message pending on it and closes the socket, so the web popup serves those
                // calls. The drop costs the server nothing, and a client that keeps sending stays on
                // an empty budget, where a destroyed socket would only be replaced by a new
                // connection with a full one.
                if (!hasWarnedAboutHandshakes) {
                    hasWarnedAboutHandshakes = true;
                    deps.logger.warn(
                        LOG_PREFIX,
                        `handshake rate limit exceeded by ${peer} (origin: ${params.originKey})`,
                    );
                }

                return;
            }

            // A call without a valid manifest is dropped without a response, so acknowledging
            // the handshake would leave the client waiting and hold the connection slot.
            const handshakeManifest = parseManifest(message.payload.settings.manifest);
            if (!handshakeManifest) {
                deps.logger.warn(
                    LOG_PREFIX,
                    `connection closed: invalid handshake manifest from ${peer} (origin: ${params.originKey})`,
                );
                params.connection.destroy();

                return;
            }

            // The client handshakes before every call, so expiring the connection during the lookup
            // would fail that call and make the client fall back to the web popup.
            clearIdleTimeout();
            const processOnPort = await lookup.lookUp();
            context = {
                manifest: handshakeManifest,
                version: parseVersion(message.payload.settings.version),
                requestedPermissions: message.payload.settings.requestedPermissions,
                processOnPort,
            };
            _isHandshakeDone = true;
            clearTimeout(deadline);
            params.sendHandshakeAck(message.id);
            if (!params.hasPendingCalls()) {
                startIdleTimeout();
            }
        };

        const dispose = () => {
            clearTimeout(deadline);
            clearIdleTimeout();
            lookup.abort();
        };

        return {
            handleHandshake,
            getContext: () => context,
            isHandshakeDone: () => _isHandshakeDone,
            startIdleTimeout,
            clearIdleTimeout,
            dispose,
        };
    };
