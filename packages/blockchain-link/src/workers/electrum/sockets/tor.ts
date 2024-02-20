import { SocketBase, SocketConfig } from './base';
import type { SocksProxyAgent } from 'socks-proxy-agent';
import type { SocketListener } from './interface';

type TorSocketConfig = SocketConfig & {
    proxyAgent: SocksProxyAgent;
};

export class TorSocket extends SocketBase {
    private proxyAgent: SocksProxyAgent;

    constructor({ proxyAgent, ...rest }: TorSocketConfig) {
        super(rest);
        this.proxyAgent = proxyAgent;
    }

    protected async openSocket(listener: SocketListener) {
        const { host, port } = this;
        const socket = await this.proxyAgent
            .callback(null as any, { host, port, timeout: this.timeout, secureEndpoint: false })
            .catch(e => {
                listener.onError(e);
                throw e;
            });
        listener.onConnect();
        this.configureSocket(socket);
        this.bindSocket(socket, listener);

        return socket;
    }
}
