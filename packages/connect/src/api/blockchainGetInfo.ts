import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { ERRORS } from '../constants';
import { isBackendSupported, initBlockchain } from '../backend/BlockchainLink';
import { getCoinInfo } from '../data/coinInfo';
import type { CoinInfo } from '../types';

type Params = {
    coinInfo: CoinInfo;
    identity?: string;
};

export default class BlockchainGetInfo extends AbstractMethod<'blockchainGetInfo', Params> {
    init() {
        this.useDevice = false;
        this.useUi = false;

        const { payload } = this;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'coin', type: 'string', required: true },
            { name: 'identity', type: 'string' },
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
        };
    }

    async run() {
        const backend = await initBlockchain(
            this.params.coinInfo,
            this.postMessage,
            this.params.identity,
        );

        return backend.getNetworkInfo();
    }
}
