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

    public static getIdentity(identity: string): SocksProxyAgent {
        if (!this.torController) {
            throw new Error('TorIdentities is not initialized');
        }
        if (!this.identities[identity]) {
            this.identities[identity] = new SocksProxyAgent({
                hostname: this.torController.options.host,
                port: this.torController.options.port,
                userId: identity,
                password: identity,
            });
        }
        return this.identities[identity];
    }
}
