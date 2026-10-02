import type { ChainableBeforeSend } from './types';

// The anon-rpc browser harness prepends this argument to every log call it forwards from the
// client, so the client itself cannot leave it out.
const ANON_RPC_CLIENT_LOG_MARKER = '[worker]';

/**
 * The anon-rpc client is untrusted code that sees every request it relays, addresses and
 * transactions included, and its log calls end up in the host console. A captured console error
 * would carry them to Sentry, so those events are dropped whole.
 */
export const dropAnonRpcClientLogs: ChainableBeforeSend = event => {
    if (event === null) return null;

    const consoleArguments = event.extra?.arguments;
    const isAnonRpcClientLog =
        event.logger === 'console' &&
        Array.isArray(consoleArguments) &&
        consoleArguments[0] === ANON_RPC_CLIENT_LOG_MARKER;

    return isAnonRpcClientLog ? null : event;
};
