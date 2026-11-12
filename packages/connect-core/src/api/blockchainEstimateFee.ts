// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainEstimateFee.js

import { TrezorBlockchain } from '@trezor/blockchain-core';
import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';

import type { MethodMessage, Payload } from '../core/AbstractMethod';
import { AbstractBlockchainMethod } from './common/AbstractBlockchainMethod';
import { validateParams } from './common/paramsValidator';
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

    callBlockchain() {
        const { payload } = this;

        // The payload is a union of the overloads' params, told apart by the fee levels requested.
        return payload.request?.feeLevels
            ? TrezorBlockchain.estimateFeeLevels(
                  payload as Parameters<typeof TrezorBlockchain.estimateFeeLevels>[0],
              )
            : TrezorBlockchain.estimateFee(
                  payload as Parameters<typeof TrezorBlockchain.estimateFee>[0],
              );
    }
}
