import { AbstractMethod, Payload } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { ERRORS } from '../constants';
import { CoinInfo } from '../types';
import { initBlockchain, isBackendSupported } from '../backend/BlockchainLink';
import { getCoinInfo } from '../data/coinInfo';

type Params = {
    coinInfo: CoinInfo;
    identity?: string;
    request: Omit<Payload<'blockchainEvmRpcCall'>, 'method' | 'coin'>;
};

export default class BlockchainEvmRpcCall extends AbstractMethod<'blockchainEvmRpcCall', Params> {
    init() {
        this.useDevice = false;
        this.useUi = false;

        const { payload } = this;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'coin', type: 'string', required: true },
            { name: 'identity', type: 'string' },
            { name: 'from', type: 'string' },
            { name: 'to', type: 'string', required: true },
            { name: 'data', type: 'string', required: true },
        ]);

        const coinInfo = getCoinInfo(payload.coin);

        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }
        // validate backend
        isBackendSupported(coinInfo);

        this.params = {
            coinInfo,
            identity: payload.identity,
            request: {
                from: payload.from,
                to: payload.to,
                data: payload.data,
            },
        };
    }

    get info() {
        return 'Blockchain Evm Rpc Call';
    }

    async run() {
        const backend = await initBlockchain(
            this.params.coinInfo,
            postMessage,
            this.params.identity,
        );
        const response = await backend.rpcCall(this.params.request);

        return response;
    }
}
