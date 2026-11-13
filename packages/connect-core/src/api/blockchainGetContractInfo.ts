import { getContractInfo } from '@trezor/blockchain-core/src/api/getContractInfo';
import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';

import type { MethodContext, MethodMessage, Payload } from '../core/AbstractMethod';
import { AbstractBlockchainMethod } from './common/AbstractBlockchainMethod';
import { getCoinInfoOrThrow } from '../data/coinInfo';
import { validateParams } from './common/paramsValidator';

type Params = {
    coinInfo: CoinInfo;
    identity?: string;
    request: Pick<Payload<'blockchainGetContractInfo'>, 'contract' | 'currency' | 'protocols'>;
};

export default class BlockchainGetContractInfo extends AbstractBlockchainMethod<
    'blockchainGetContractInfo',
    Params
> {
    constructor(message: MethodMessage<'blockchainGetContractInfo'>) {
        const { payload } = message;

        validateParams(payload, [
            { name: 'coin', type: 'string', required: true },
            { name: 'contract', type: 'string', required: true },
            { name: 'identity', type: 'string' },
        ]);

        const coinInfo = getCoinInfoOrThrow(payload.coin);

        const request = {
            contract: payload.contract,
            currency: payload.currency,
            protocols: payload.protocols,
        };

        super(message, {
            coinInfo,
            identity: payload.identity,
            request,
        });
    }

    get requiredPermissions(): PermissionRequest[] {
        return [];
    }

    run({ sendCoreMessage }: MethodContext) {
        return getContractInfo(this.payload, sendCoreMessage);
    }
}
