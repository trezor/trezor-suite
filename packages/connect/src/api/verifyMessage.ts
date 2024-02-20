// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/VerifyMessage.js

import { AbstractMethod } from '../core/AbstractMethod';
import { getFirmwareRange } from './common/paramsValidator';
import { getBitcoinNetwork } from '../data/coinInfo';
import { getLabel } from '../utils/pathUtils';
import { messageToHex } from '../utils/formatUtils';
import { PROTO, ERRORS } from '../constants';
import { VerifyMessage as VerifyMessageSchema } from '../types';
import { Assert } from '@trezor/schema-utils';

export default class VerifyMessage extends AbstractMethod<'verifyMessage', PROTO.VerifyMessage> {
    init() {
        this.requiredPermissions = ['read', 'write'];

        const { payload } = this;

        // validate incoming parameters for each batch
        Assert(VerifyMessageSchema, payload);

        const coinInfo = getBitcoinNetwork(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        } else {
            // check required firmware with coinInfo support
            this.firmwareRange = getFirmwareRange(this.name, coinInfo, this.firmwareRange);
        }
        const messageHex = payload.hex
            ? messageToHex(payload.message)
            : Buffer.from(payload.message, 'utf8').toString('hex');
        const signatureHex = Buffer.from(payload.signature, 'base64').toString('hex');

        this.params = {
            address: payload.address,
            signature: signatureHex,
            message: messageHex,
            coin_name: coinInfo.name,
        };
    }

    get info() {
        const coinInfo = getBitcoinNetwork(this.payload.coin);
        if (!coinInfo) {
            return 'Verify message';
        }

        return getLabel('Verify #NETWORK message', coinInfo);
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('VerifyMessage', 'Success', this.params);

        return response.message;
    }
}
