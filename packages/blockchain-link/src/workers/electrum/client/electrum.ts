import { Network, networks } from '@trezor/utxo-lib';
import { ElectrumAPI, BlockHeader, Version } from '@trezor/blockchain-link-types/lib/electrum';
import { JsonRpcClientOptions } from './json-rpc';
import { BatchingJsonRpcClient } from './batching';
import type { ISocket } from '../sockets/interface';

const KEEP_ALIVE_INTERVAL = 120 * 1000; // 2 minutes

type ElectrumClientOptions = JsonRpcClientOptions & {
    client: {
        name: string;
        protocolVersion: string | [string, string];
    };
    url: string;
    coin: string;
};

const selectNetwork = (shortcut?: string) => {
    switch (shortcut) {
        case 'REGTEST':
            return networks.regtest;
        case 'TEST':
            return networks.testnet;
        default:
            return networks.bitcoin;
    }
};

export class ElectrumClient extends BatchingJsonRpcClient implements ElectrumAPI {
    private options?: ElectrumClientOptions;
    private network?: Network;
    private version?: Version;
    protected lastBlock?: BlockHeader;
    private timeLastCall = 0;

    async connect(socket: ISocket, options: ElectrumClientOptions) {
        this.timeLastCall = 0;
        this.options = options;
        this.network = selectNetwork(options.coin);

        const { name, protocolVersion } = options.client;

        await super.connect(socket, options);

        try {
            // this.banner = await (this as ElectrumAPI).request('server.banner');
            this.version = await (this as ElectrumAPI).request(
                'server.version',
                name,
                protocolVersion,
            );
            // Simplified version of BlueWallet's heuristics. Might be improved later.
            // https://github.com/BlueWallet/BlueWallet/blob/509add5c59a4f84e0f49b4d3891ed5a650e2adb2/blue_modules/BlueElectrum.js#L146
            if (
                this.version[0]?.startsWith('ElectrumPersonalServer') ||
                this.version[0]?.startsWith('electrs-esplora')
            ) {
                this.batchingDisabled = true;
            }
            (this as ElectrumAPI).on('blockchain.headers.subscribe', this.onBlock.bind(this));
            this.lastBlock = await (this as ElectrumAPI).request('blockchain.headers.subscribe');
        } catch (err) {
            this.socket = undefined;
            throw new Error(`Communication with Electrum server failed: [${err}]`);
        }

        this.keepAlive();
    }

    getInfo() {
        if (this.options?.url && this.version && this.lastBlock && this.network) {
            return {
                url: this.options.url,
                version: this.version,
                block: this.lastBlock,
                coin: this.options.coin,
                network: this.network,
            };
        }
    }

    private onBlock(blocks: BlockHeader[]) {
        const [last] = blocks.sort((a, b) => b.height - a.height);
        if (last) this.lastBlock = last;
    }

    request(method: string, ...params: any[]) {
        this.timeLastCall = new Date().getTime();
        return super.request(method, ...params);
    }

    private keepAliveHandle?: ReturnType<typeof setInterval>;
    private keepAlive() {
        if (!this.socket) return;
        this.keepAliveHandle = setInterval(async () => {
            if (
                this.timeLastCall !== 0 &&
                new Date().getTime() > this.timeLastCall + KEEP_ALIVE_INTERVAL / 2
            ) {
                await (this as ElectrumAPI).request('server.ping').catch(err => {
                    console.error(`Ping to server failed: [${err}]`);
                    this.close();
                });
            }
        }, KEEP_ALIVE_INTERVAL);
    }

    onClose() {
        super.onClose();
        if (this.keepAliveHandle) clearInterval(this.keepAliveHandle);
    }
}
