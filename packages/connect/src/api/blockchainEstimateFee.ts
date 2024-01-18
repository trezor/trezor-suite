// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainEstimateFee.js

import { Payload, MethodReturnType, AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { ERRORS } from '../constants';
import { FeeLevels } from './bitcoin/Fees';
import { isBackendSupported, initBlockchain } from '../backend/BlockchainLink';
import { getCoinInfo } from '../data/coinInfo';
import type { CoinInfo } from '../types';

type Params = {
    coinInfo: CoinInfo;
    identity?: string;
    request: Payload<'blockchainEstimateFee'>['request'];
};

export default class BlockchainEstimateFee extends AbstractMethod<'blockchainEstimateFee', Params> {
    init() {
        this.useDevice = false;
        this.useUi = false;

        const { payload } = this;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'coin', type: 'string', required: true },
            { name: 'identity', type: 'string' },
            { name: 'request', type: 'object' },
        ]);

        const { request, identity } = payload;

        if (request) {
            validateParams(request, [
                { name: 'blocks', type: 'array' },
                { name: 'specific', type: 'object' },
                { name: 'feeLevels', type: 'string' },
            ]);
            if (request.specific) {
                validateParams(request.specific, [
                    { name: 'conservative', type: 'boolean' },
                    { name: 'data', type: 'string' },
                    { name: 'from', type: 'string' },
                    { name: 'to', type: 'string' },
                    { name: 'txsize', type: 'number' },
                ]);
            }
        }
        const coinInfo = getCoinInfo(payload.coin);

        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }
        // validate backend
        isBackendSupported(coinInfo);

        this.params = {
            coinInfo,
            identity,
            request,
        };
    }

    async run() {
        const { coinInfo, identity, request } = this.params;
        const feeInfo: MethodReturnType<typeof this.name> = {
            blockTime: coinInfo.blockTime,
            minFee: coinInfo.minFee,
            maxFee: coinInfo.maxFee,
            dustLimit: coinInfo.type === 'bitcoin' ? coinInfo.dustLimit : undefined,
            levels: [],
        };
        if (request && request.feeLevels) {
            const fees = new FeeLevels(coinInfo);
            // TODO: https://github.com/trezor/trezor-suite/issues/5340
            // smart fees for DOGE are not relevant since their fee policy changed, see @trezor/utxo-lib/compose: baseFee
            if (request.feeLevels === 'smart' && coinInfo.shortcut !== 'DOGE') {
                const backend = await initBlockchain(coinInfo, this.postMessage, identity);
                await fees.load(backend);
            }
            feeInfo.levels = fees.levels;
        } else {
            const backend = await initBlockchain(coinInfo, this.postMessage, identity);
            feeInfo.levels = await backend.estimateFee(request || {});
        }

        return feeInfo;
    }
}
