/**
 * Name of the error's type, e.g. `HttpRequestError`. A viem error also quotes the request it failed
 * on, which carries the account address in its calldata and the RPC URL, so the message and the
 * error itself must be kept out of anything that can leave the device, logs included.
 */
export const getErrorName = (error: unknown) =>
    error instanceof Error ? error.name : 'unknown error';

export type RpcErrorInfo = { code?: number; status?: number; message: string };

/** viem nests the JSON-RPC error, and how deeply depends on the transport. */
export const getRpcErrorInfo = (error: unknown): RpcErrorInfo => {
    const messages: string[] = [];
    let code: number | undefined;
    let status: number | undefined;
    let current: unknown = error;

    for (let depth = 0; current && depth < 5; depth++) {
        const candidate = current as {
            code?: unknown;
            status?: unknown;
            message?: unknown;
            cause?: unknown;
        };
        if (code === undefined && typeof candidate.code === 'number') {
            code = candidate.code;
        }
        if (status === undefined && typeof candidate.status === 'number') {
            status = candidate.status;
        }
        if (typeof candidate.message === 'string') {
            messages.push(candidate.message);
        }
        current = candidate.cause;
    }

    return { code, status, message: messages.join(' | ') };
};
