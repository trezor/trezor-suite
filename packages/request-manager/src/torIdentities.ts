import { SocksProxyAgent } from 'socks-proxy-agent';
import type { TorSettings } from './types';

export class TorIdentities {
    private readonly getTorSettings: () => TorSettings;
    private readonly identities: { [key: string]: SocksProxyAgent };

    constructor(getTorSettings: () => TorSettings) {
        this.getTorSettings = getTorSettings;
        this.identities = {};
    }

    public getIdentity(
        identity: string,
        timeout?: number,
        protocol?: 'http' | 'https',
    ): SocksProxyAgent {
        const [user, password] = identity.split(':');

        if (this.identities[user] && password) {
            this.removeIdentity(user);
        }

        const { host, port } = this.getTorSettings();

        // TODO clean agents when host/port changes?

        if (!this.identities[user]) {
            this.identities[user] = new SocksProxyAgent({
                hostname: host,
                port,
                userId: user,
                password: password || user,
                timeout,
            });
        }

        const agent = this.identities[user];

        // @sentry/node (used in suite-desktop) is wrapping each outgoing request
        // and requires protocol to be explicitly set to https while using TOR + https/wss address combination
        if (protocol) agent.protocol = `${protocol}:`;

        return agent;
    }

    public removeIdentity(user: string) {
        // looks like destroy does nothing, but just in case
        this.identities[user].destroy();
        delete this.identities[user];
    }
}
