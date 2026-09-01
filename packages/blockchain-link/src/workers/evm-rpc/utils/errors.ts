/**
 * Name of the error's type, e.g. `HttpRequestError`. A viem error also quotes the request it failed
 * on, which carries the account address in its calldata and the RPC URL, so the message and the
 * error itself must be kept out of anything that can leave the device, logs included.
 */
export const getErrorName = (error: unknown) =>
    error instanceof Error ? error.name : 'unknown error';
