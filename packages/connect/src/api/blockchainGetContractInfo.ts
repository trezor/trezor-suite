import type { CoinInfo, MethodPermission } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';

import { initBlockchain, isBackendSupported } from '../backend/BlockchainLink';
import type { MethodContext, MethodMessage, Payload } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getCoinInfo } from '../data/coinInfo';
import { validateParams } from './common/paramsValidator';

type Params = {
    coinInfo: CoinInfo;
    identity?: string;
    request: Pick<Payload<'blockchainGetContractInfo'>, 'contract' | 'currency' | 'protocols'>;
};

export default class BlockchainGetContractInfo extends AbstractMethod<
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

        const coinInfo = getCoinInfo(payload.coin);

        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }

        isBackendSupported(coinInfo);

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

        this.useDevice = false;
        this.useUi = false;
    }

    get requiredPermissions(): MethodPermission[] {
        return [];
    }

    async run({ sendCoreMessage }: MethodContext) {
        const backend = await initBlockchain(
            this.params.coinInfo,
            sendCoreMessage,
            this.params.identity,
        );

        return backend.getContractInfo(this.params.request);
    }
}
