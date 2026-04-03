// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/VerifyMessage.js

import { VerifyMessage as VerifyMessageSchema } from '@trezor/connect-common';
import type { CoinInfo, PROTO } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getBitcoinNetwork } from '../data/coinInfo';
import { validateModelOneMessageSize } from '../device/validateMessageSize';
import { messageToHex } from '../utils/formatUtils';
import { getLabel } from '../utils/pathUtils';

type Params = {
    proto: PROTO.VerifyMessage;
    coinInfo: CoinInfo;
};

export default class VerifyMessage extends AbstractMethod<'verifyMessage', Params> {
    constructor(message: MethodMessage<'verifyMessage'>) {
        const { payload } = message;

        // validate incoming parameters for each batch
        Assert(VerifyMessageSchema, payload);

        const coinInfo = getBitcoinNetwork(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }
        const messageHex = payload.hex
            ? messageToHex(payload.message)
            : Buffer.from(payload.message, 'utf8').toString('hex');
        const signatureHex = Buffer.from(payload.signature, 'base64').toString('hex');

        const proto = {
            address: payload.address,
            signature: signatureHex,
            message: messageHex,
            coin_name: coinInfo.name,
        };

        const params = { proto, coinInfo };

        super(message, params);

        this.requiredFirmwareCoins = [coinInfo];
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read', 'write'];
    }

    get info() {
        return getLabel('Verify #NETWORK message', this.params.coinInfo);
    }

    async run() {
        validateModelOneMessageSize(this.getDevice(), this.params.proto.message);

        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('VerifyMessage', 'Success', this.params.proto);

        return response.message;
    }
}
