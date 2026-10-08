export type ChainNodeFetchDeps = {
    fetch: typeof fetch;

    /** Lets the app reach a host; the desktop app blocks the hosts it does not know. */
    allowHost: (hostname: string) => Promise<boolean>;
};

/** The app's fetch for nodes a network reads directly (runtime EVM networks, a fullnode). */
export type ChainNodeFetch = typeof fetch;

const getHostname = (input: Parameters<typeof fetch>[0]) =>
    new URL(typeof input === 'string' || input instanceof URL ? input : input.url).hostname;

/**
 * Fetches from the nodes a network reads directly rather than through Connect, asking once per
 * host that the app let it through. A refusal is not remembered, so the next request asks again.
 */
export const createChainNodeFetch = (deps: ChainNodeFetchDeps): ChainNodeFetch => {
    const allowances = new Map<string, Promise<boolean>>();

    const allowHost = async (hostname: string) => {
        const allowance = allowances.get(hostname) ?? deps.allowHost(hostname).catch(() => false);
        allowances.set(hostname, allowance);

        const isAllowed = await allowance;
        if (!isAllowed) allowances.delete(hostname);

        return isAllowed;
    };

    return async (input, init) => {
        const hostname = getHostname(input);

        if (!(await allowHost(hostname))) {
            throw new Error(`The app does not allow requests to ${hostname}.`);
        }

        return deps.fetch(input, init);
    };
};
