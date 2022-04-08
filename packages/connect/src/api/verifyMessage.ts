// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/VerifyMessage.js

import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams, getFirmwareRange } from './common/paramsValidator';
import { getBitcoinNetwork } from '../data/CoinInfo';
import { getLabel } from '../utils/pathUtils';
import { messageToHex } from '../utils/formatUtils';
import { PROTO, ERRORS } from '../constants';

export default class VerifyMessage extends AbstractMethod<'verifyMessage'> {
    params: PROTO.VerifyMessage;

    init() {
        this.requiredPermissions = ['read', 'write'];
        this.info = 'Verify message';

        const { payload } = this;

        // validate incoming parameters for each batch
        validateParams(payload, [
            { name: 'address', type: 'string', required: true },
            { name: 'signature', type: 'string', required: true },
            { name: 'message', type: 'string', required: true },
            { name: 'coin', type: 'string', required: true },
            { name: 'hex', type: 'boolean' },
        ]);

        const coinInfo = getBitcoinNetwork(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        } else {
            // check required firmware with coinInfo support
            this.firmwareRange = getFirmwareRange(this.name, coinInfo, this.firmwareRange);
            this.info = getLabel('Verify #NETWORK message', coinInfo);
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

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('VerifyMessage', 'Success', this.params);
        return response.message;
    }
}
