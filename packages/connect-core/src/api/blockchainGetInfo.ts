import { getInfo } from '@trezor/blockchain-core/src/api/getInfo';
import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';

import { AbstractBlockchainMethod } from './common/AbstractBlockchainMethod';
import { validateParams } from './common/paramsValidator';
import type { MethodContext, MethodMessage } from '../core/AbstractMethod';
import { getCoinInfoOrThrow } from '../data/coinInfo';

type Params = {
    coinInfo: CoinInfo;
    identity?: string;
};

export default class BlockchainGetInfo extends AbstractBlockchainMethod<
    'blockchainGetInfo',
    Params
> {
    constructor(message: MethodMessage<'blockchainGetInfo'>) {
        const { payload } = message;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'coin', type: 'string', required: true },
            { name: 'identity', type: 'string' },
        ]);

        const coinInfo = getCoinInfoOrThrow(payload.coin);

        const params = {
            coinInfo,
            identity: payload.identity,
        };

        super(message, params);
    }

    get requiredPermissions(): PermissionRequest[] {
        return [];
    }

    run({ sendCoreMessage }: MethodContext) {
        return getInfo(this.payload, sendCoreMessage);
    }
}
