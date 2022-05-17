import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams, getFirmwareRange } from './common/paramsValidator';
import { validatePath, getScriptType } from '../utils/pathUtils';
import { getBitcoinNetwork } from '../data/coinInfo';
import { PROTO } from '../constants';

export default class AuthorizeCoinJoin extends AbstractMethod<
    'authorizeCoinJoin',
    PROTO.AuthorizeCoinJoin
> {
    init() {
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
        ]);

        const address_n = validatePath(payload.path, 3);
        const script_type = payload.scriptType || getScriptType(address_n);
        const coinInfo = getBitcoinNetwork(payload.coin || address_n);
        this.firmwareRange = getFirmwareRange(this.name, coinInfo, this.firmwareRange);

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
        if (!this.device.features.experimental_features) {
            // enable experimental features
            await cmd.typedCall('ApplySettings', 'Success', { experimental_features: true });
        }

        const response = await cmd.typedCall('AuthorizeCoinJoin', 'Success', this.params);
        return response.message;
    }
}
