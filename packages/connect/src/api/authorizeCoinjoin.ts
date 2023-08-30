import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams, getFirmwareRange } from './common/paramsValidator';
import { validatePath, getScriptType } from '../utils/pathUtils';
import { getBitcoinNetwork } from '../data/coinInfo';
import { PROTO } from '../constants';

export default class AuthorizeCoinjoin extends AbstractMethod<
    'authorizeCoinjoin',
    PROTO.AuthorizeCoinJoin
> {
    async init() {
        const { payload } = this;

        validateParams(payload, [
            { name: 'path', required: true },
            { name: 'coordinator', type: 'string', required: true },
            { name: 'maxRounds', type: 'number', required: true },
            { name: 'maxCoordinatorFeeRate', type: 'number', required: true },
            { name: 'maxFeePerKvbyte', type: 'number', required: true },
            { name: 'coin', type: 'string' },
            { name: 'scriptType', type: 'string' },
            { name: 'amountUnit', type: 'uint' },
            { name: 'preauthorized', type: 'boolean' },
        ]);

        const address_n = validatePath(payload.path, 3);
        const script_type = payload.scriptType || getScriptType(address_n);
        const coinInfo = getBitcoinNetwork(payload.coin || address_n);
        this.firmwareRange = getFirmwareRange(this.name, coinInfo, this.firmwareRange);
        this.preauthorized = payload.preauthorized;

        this.params = {
            coordinator: payload.coordinator,
            max_rounds: payload.maxRounds,
            max_coordinator_fee_rate: payload.maxCoordinatorFeeRate,
            max_fee_per_kvbyte: payload.maxFeePerKvbyte,
            address_n,
            coin_name: coinInfo?.name,
            script_type,
            amount_unit: payload.amountUnit,
        };
    }

    async run() {
        const cmd = this.device.getCommands();

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
