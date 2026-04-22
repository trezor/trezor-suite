import { AuthorizeCoinjoin as AuthorizeCoinjoinSchema } from '@trezor/connect-common';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getBitcoinNetwork } from '../data/coinInfo';
import { getScriptType, validatePath } from '../utils/pathUtils';

export default class AuthorizeCoinjoin extends AbstractMethod<
    'authorizeCoinjoin',
    PROTO.AuthorizeCoinJoin
> {
    constructor(message: MethodMessage<'authorizeCoinjoin'>) {
        const { payload } = message;

        Assert(AuthorizeCoinjoinSchema, payload);
        const address_n = validatePath(payload.path, 3);
        const script_type = payload.scriptType || getScriptType(address_n);
        const coinInfo = getBitcoinNetwork(payload.coin || address_n);

        const params = {
            coordinator: payload.coordinator,
            max_rounds: payload.maxRounds,
            max_coordinator_fee_rate: payload.maxCoordinatorFeeRate,
            max_fee_per_kvbyte: payload.maxFeePerKvbyte,
            address_n,
            coin_name: coinInfo?.name,
            script_type,
            amount_unit: payload.amountUnit,
        };

        super(message, params);

        this.requiredFirmwareCoins = [coinInfo];
        this.preauthorized = payload.preauthorized;
    }

    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    async run() {
        const cmd = this.getDevice().getCommands();

        if (this.preauthorized) {
            if (await cmd.preauthorize(false)) {
                // device is already preauthorized
                return { message: 'Success' };
            }
        }

        const response = await cmd.typedCall('AuthorizeCoinJoin', 'Success', this.params);

        return response.message;
    }
}
