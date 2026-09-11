// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/VerifyMessage.js

import { VerifyMessage as VerifyMessageSchema } from '@trezor/connect-common';
import type { CoinInfo, PROTO, PermissionRequest } from '@trezor/connect-common';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getBitcoinNetworkOrThrow } from '../data/coinInfo';
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

        const coinInfo = getBitcoinNetworkOrThrow(payload.coin);
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

    get requiredPermissions(): PermissionRequest[] {
        return [this.coinPerm('verify_message', this.params.coinInfo)];
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
