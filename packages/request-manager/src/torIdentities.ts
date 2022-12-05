import { SocksProxyAgent } from 'socks-proxy-agent';
import { TorController } from './controller';

export class TorIdentities {
    static torController: TorController;
    static identities: { [key: string]: SocksProxyAgent };

    public static init(torController: TorController) {
        this.torController = torController;
        this.identities = {};
        // When initializing create default identity, so it is ready to use.
        this.getIdentity('default');
    }

    public static getIdentity(identity: string, timeout?: number): SocksProxyAgent {
        if (!this.torController) {
            throw new Error('TorIdentities is not initialized');
        }

        const [user, password] = identity.split(':');

        if (this.identities[user] && password) {
            // looks like destroy does nothing, but just in case
            this.identities[user].destroy();
            delete this.identities[user];
        }

        if (!this.identities[user]) {
            this.identities[user] = new SocksProxyAgent({
                hostname: this.torController.options.host,
                port: this.torController.options.port,
                userId: user,
                password: password || user,
                timeout,
            });
        }

        return this.identities[user];
    }
}
