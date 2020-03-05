import RpcBitcoinClient from 'node-bitcoin-rpc';
import { EventEmitter } from 'events';
import { CustomError } from '../../constants/errors';
import { create as createDeferred, Deferred } from '../../utils/deferred';
import {
    AccountInfoParams,
    EstimateFeeParams,
    BlockNotification,
    AddressNotification,
    Send,
} from '../../types/blockbook';

export default class RpcClient {
    constructor() {
        const config = {
            rpc_username: 'rpc',
            rpc_password: 'rpc',
            host: 'blockbook-dev.corp.sldev.cz',
            port: '18030',
        };

        RpcBitcoinClient.init(config.host, config.port, config.rpc_username, config.rpc_password);
    }

    getBlockchainInfo() {
        return new Promise<any>((resolve, reject) => {
            console.log('before'); // getnetworkinfo getwalletinfo getblockchaininfo
            RpcBitcoinClient.call('getblockchaininfo', [], function callback(
                error: string,
                response: any
            ): void {
                if (error) {
                    reject(error);
                } else if (response.result) {
                    resolve(response.result);
                } else {
                    console.log('response', response);
                    reject(new Error('bad data from RPC server')); // TODO: attach to custom error class?
                }
            });
        });
    }

    getNetworkInfo() {
        return new Promise<any>((resolve, reject) => {
            console.log('before'); // getnetworkinfo getwalletinfo getblockchaininfo
            RpcBitcoinClient.call('getnetworkinfo', [], function callback(
                error: string,
                response: any
            ): void {
                if (error) {
                    reject(error);
                } else if (response.result) {
                    resolve(response.result);
                } else {
                    console.log('response', response);
                    reject(new Error('bad data from RPC server')); // TODO: attach to custom error class?
                }
            });
        });
    }
    // getBlockchainInfo(): Promise {
    //     console.log('before'); // getnetworkinfo getwalletinfo
    //     RpcBitcoinClient.call('getrpcinfo', [], function callback(
    //         error: string,
    //         response: any
    //     ): void {
    //         if (error) {
    //             console.log('some error', error);
    //         } else {
    //             console.log('response:', response);
    //         }
    //     });
    // }
    // setConnectionTimeout() {
    //     this.clearConnectionTimeout();
    //     this.connectionTimeout = setTimeout(
    //         this.onTimeout.bind(this),
    //         this.options.timeout || DEFAULT_TIMEOUT
    //     );
    // }

    // clearConnectionTimeout() {
    //     if (this.connectionTimeout) {
    //         clearTimeout(this.connectionTimeout);
    //         this.connectionTimeout = undefined;
    //     }
    // }

    // dispose() {
    //     if (this.pingTimeout) {
    //         clearTimeout(this.pingTimeout);
    //     }
    //     if (this.connectionTimeout) {
    //         clearTimeout(this.connectionTimeout);
    //     }

    //     const { ws } = this;
    //     if (this.isConnected()) {
    //         this.disconnect();
    //     }
    //     if (ws) {
    //         ws.removeAllListeners();
    //     }

    //     this.removeAllListeners();
    // }
}
