import { Log } from '@trezor/utils';

import { TrezordNode } from './http';

const logger = new Log('@trezor/transport-bridge', true);

// The standalone daemon has no supervisor (the desktop utilityProcess respawns via
// keepAlive). A synchronous throw from a request handler surfaces as an unhandled promise
// rejection — the body parsers hand off to handlers inside a `.then` — and would, by
// Node's default, crash the daemon with nothing to restart it. Log it and keep serving: a
// request-scoped throw must not take the whole bridge down. We deliberately do NOT install
// an `uncaughtException` handler — a truly uncaught synchronous exception is not
// request-scoped and should fail loud (Node's default) rather than leave the process alive
// in an undefined state.
process.on('unhandledRejection', reason => {
    logger.error(
        `Unhandled rejection: ${reason instanceof Error ? (reason.stack ?? reason.message) : String(reason)}`,
    );
});

const trezordNode = new TrezordNode({
    api: process.argv.includes('udp') ? 'udp' : 'usb',
    logger,
});

// A startup failure (e.g. the port is already in use) rejects `start()`. It is fatal: exit
// instead of lingering as a process that is alive but not serving. Catch it explicitly so
// the unhandledRejection backstop above cannot mask it into a zombie.
trezordNode.start().catch((error: unknown) => {
    logger.error(
        `Bridge failed to start: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
    );
    process.exit(1);
});
