// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetAccountInfo.js

import type {
    CoinInfo,
    GetAccountInfo as GetAccountInfoParams,
    PermissionRequest,
} from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getCoinInfoOrThrow } from '../data/coinInfo';
import { validateParams } from './common/paramsValidator';
import { getLabel } from '../utils/pathUtils';

type Params = GetAccountInfoParams & { descriptor: string; coinInfo: CoinInfo };

export default class GetAccountInfo extends AbstractMethod<'getAccountInfo', Params> {
    constructor(message: MethodMessage<'getAccountInfo'>) {
        const { payload } = message;

        // Deriving the descriptor on the device and bundles are left to Trezor Suite.
        if (payload.bundle || payload.path) {
            throw ERRORS.TypedError(
                'Method_NotAllowed',
                'GetAccountInfo: path and bundle are available only through Trezor Suite',
            );
        }

        validateParams(payload, [
            { name: 'coin', type: 'string', required: true },
            { name: 'identity', type: 'string' },
            { name: 'descriptor', type: 'string', required: true },

            { name: 'details', type: 'string' },
            { name: 'tokens', type: 'string' },
            { name: 'page', type: 'number' },
            { name: 'pageSize', type: 'number' },
            { name: 'from', type: 'number' },
            { name: 'to', type: 'number' },
            { name: 'contractFilter', type: 'string' },
            { name: 'gap', type: 'number' },
            { name: 'marker', type: 'object' },
            { name: 'protocols', type: 'array' },
            // An empty list is meaningful: the account watches no contract tokens yet.
            { name: 'stellarContractTokens', type: 'array', allowEmpty: true },
            { name: 'confirmedNonce', type: 'boolean' },
            { name: 'privatePending', type: 'object' },
        ]);

        const coinInfo = getCoinInfoOrThrow(payload.coin);

        super(message, { ...payload, descriptor: payload.descriptor!, coinInfo });
        this.useDevice = false;
        this.useDeviceState = false;
    }

    get requiredPermissions(): PermissionRequest[] {
        return [this.coinPerm('read_account_info', this.params.coinInfo)];
    }

    get info() {
        return getLabel('Export #NETWORK account info', this.params.coinInfo);
    }

    // Read by Trezor Suite's backends instead, see its getAccountInfo popup flow.
    run() {
        return Promise.reject(
            ERRORS.TypedError(
                'Method_NotAllowed',
                'getAccountInfo is available only through Trezor Suite',
            ),
        );
    }
}
