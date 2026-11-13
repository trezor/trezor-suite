// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainEstimateFee.js

import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';

import { AbstractBlockchainMethod } from './common/AbstractBlockchainMethod';
import { validateParams } from './common/paramsValidator';
import { estimateFee } from '../blockchain/api/estimateFee';
import type { MethodContext, MethodMessage, Payload } from '../core/AbstractMethod';
import { getCoinInfoOrThrow } from '../data/coinInfo';

type Params = {
    coinInfo: CoinInfo;
    identity?: string;
    request: Payload<'blockchainEstimateFee'>['request'];
};

export default class BlockchainEstimateFee extends AbstractBlockchainMethod<
    'blockchainEstimateFee',
    Params
> {
    constructor(message: MethodMessage<'blockchainEstimateFee'>) {
        const { payload } = message;

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
                    { name: 'privatePending', type: 'object' },
                ]);
            }
        }
        const coinInfo = getCoinInfoOrThrow(payload.coin);

        const params = { coinInfo, identity, request };

        super(message, params);
    }

    get requiredPermissions(): PermissionRequest[] {
        return [];
    }

    run({ sendCoreMessage }: MethodContext) {
        // The payload is a union of the overloads' params, which no single overload accepts.
        const payload = this.payload as Parameters<typeof estimateFee>[0];

        return estimateFee(payload, sendCoreMessage);
    }
}
