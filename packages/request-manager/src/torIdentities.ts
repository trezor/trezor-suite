import { SocksProxyAgent } from 'socks-proxy-agent';
import { Socks5ProxyAgent } from 'undici';

import type { TorSettings } from './types';

// undici's Socks5ProxyAgent emits a one-time `ExperimentalWarning` from its constructor. We swallow
// only that specific warning (leaving every other warning untouched) so it doesn't pollute logs.
const createSocks5ProxyAgent = (proxyUrl: URL) => {
    const originalEmitWarning = process.emitWarning;

    process.emitWarning = (...args) => {
        const [warning, options] = args;
        const type = typeof options === 'string' ? options : (options as { type?: string })?.type;

        if (
            type === 'ExperimentalWarning' &&
            String(warning).includes('SOCKS5 proxy support is experimental')
        ) {
            return;
        }

        return originalEmitWarning(...(args as Parameters<typeof process.emitWarning>));
    };

    try {
        return new Socks5ProxyAgent(proxyUrl);
    } finally {
        process.emitWarning = originalEmitWarning;
    }
};

export class TorIdentities {
    private readonly getTorSettings: () => TorSettings;
    private readonly identities: { [key: string]: SocksProxyAgent };
    private readonly dispatchers: { [key: string]: Socks5ProxyAgent };
    private readonly passwords: { [key: string]: string };

    constructor(getTorSettings: () => TorSettings) {
        this.getTorSettings = getTorSettings;
        this.identities = {};
        this.dispatchers = {};
        this.passwords = {};
    }

    private buildSocksServerUrl(user: string, password: string) {
        const { host, port } = this.getTorSettings();

        const socksServerUrl = new URL(`socks://${host}:${port}`);
        socksServerUrl.username = user;
        socksServerUrl.password = password;

        return socksServerUrl;
    }

    // When a new password is requested for an existing identity we drop the cached agents so that
    // a fresh Tor circuit is created for the new credentials.
    private resetIdentityIfPasswordChanged(user: string, password: string) {
        if (password && this.passwords[user] !== password) {
            this.removeIdentity(user);
            this.passwords[user] = password;
        }
    }

    public getIdentity(
        identity: string,
        timeout?: number,
        protocol?: 'http' | 'https',
    ): SocksProxyAgent {
        const identityParts = identity.split(':');
        const user = identityParts[0] ?? '';
        const password = identityParts[1] ?? '';

        this.resetIdentityIfPasswordChanged(user, password);

        // TODO clean agents when host/port changes?
        if (!this.identities[user]) {
            this.identities[user] = new SocksProxyAgent(this.buildSocksServerUrl(user, password), {
                timeout,
            });
        }

        const agent: SocksProxyAgent = this.identities[user];

        // @sentry/node (used in suite-desktop) is wrapping each outgoing request
        // and requires protocol to be explicitly set to https while using TOR + https/wss address combination
        if (protocol) agent.protocol = `${protocol}:`;

        return agent;
    }

    // Returns an undici dispatcher routing through the Tor SOCKS5 proxy for the given identity.
    // Used by the fetch interceptor, since undici bypasses the http(s) module interception.
    public getDispatcher(identity: string): Socks5ProxyAgent {
        const identityParts = identity.split(':');
        const user = identityParts[0] ?? '';
        const password = identityParts[1] ?? user; // undici's Socks5ProxyAgent requires a password if user is set

        this.resetIdentityIfPasswordChanged(user, password);

        if (!this.dispatchers[user]) {
            this.dispatchers[user] = createSocks5ProxyAgent(
                this.buildSocksServerUrl(user, password),
            );
        }

        return this.dispatchers[user];
    }

    public removeIdentity(user: string) {
        // looks like destroy does nothing, but just in case
        this.identities[user]?.destroy();
        delete this.identities[user];

        this.dispatchers[user]?.destroy();
        delete this.dispatchers[user];

        delete this.passwords[user];
    }
}
