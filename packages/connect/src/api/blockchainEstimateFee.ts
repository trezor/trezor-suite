// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainEstimateFee.js

import type { CoinInfo } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';

import type {
    MethodContext,
    MethodMessage,
    MethodPermission,
    MethodReturnType,
    Payload,
} from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { initBlockchain, isBackendSupported } from '../backend/BlockchainLink';
import { getOrInitFeeLevels } from '../backend/fees';
import { getCoinInfo } from '../data/coinInfo';

type Params = {
    coinInfo: CoinInfo;
    identity?: string;
    request: Payload<'blockchainEstimateFee'>['request'];
};

export default class BlockchainEstimateFee extends AbstractMethod<'blockchainEstimateFee', Params> {
    constructor(message: MethodMessage<'blockchainEstimateFee'>) {
        super(message);
        this.useDevice = false;
        this.useUi = false;
    }

    get requiredPermissions(): MethodPermission[] {
        return [];
    }

    init() {
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
                    { name: 'newAccountProgramName', type: 'string' },
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

    async run({ sendCoreMessage }: MethodContext) {
        const { coinInfo, identity, request } = this.params;
        const feeInfo: MethodReturnType<typeof this.name> = {
            blockTime: coinInfo.blockTime,
            minFee: coinInfo.minFee,
            maxFee: coinInfo.maxFee,
            minPriorityFee: coinInfo.minPriorityFee,
            dustLimit: coinInfo.type === 'bitcoin' ? coinInfo.dustLimit : undefined,
            levels: [],
        };

        if (request?.feeLevels) {
            const feeLevelsInstance = getOrInitFeeLevels(coinInfo);

            // In Suite, request.feeLevels: 'smart' is always used to update the fee levels.
            // Only on initial load, request.feeLevels: 'preloaded' is used (see feesThunks in suite-common/wallet-core)
            if (request.feeLevels === 'smart') {
                const backend = await initBlockchain(coinInfo, sendCoreMessage, identity);
                await feeLevelsInstance.load(backend, request);
            }

            // the default fee constants from json files
            feeInfo.levels = feeLevelsInstance.levels;
        } else {
            const backend = await initBlockchain(coinInfo, sendCoreMessage, identity);
            feeInfo.levels = await backend.estimateFee(request || {});
        }

        return feeInfo;
    }
}
