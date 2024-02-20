// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/SignMessage.js

import { AbstractMethod } from '../core/AbstractMethod';
import { validateCoinPath, getFirmwareRange } from './common/paramsValidator';
import { validatePath, getLabel, getScriptType } from '../utils/pathUtils';
import { getBitcoinNetwork } from '../data/coinInfo';
import { messageToHex } from '../utils/formatUtils';
import type { BitcoinNetworkInfo } from '../types';
import type { PROTO } from '../constants';
import { SignMessage as SignMessageSchema } from '../types';
import { Assert } from '@trezor/schema-utils';

export default class SignMessage extends AbstractMethod<'signMessage', PROTO.SignMessage> {
    init() {
        this.requiredPermissions = ['read', 'write'];

        const { payload } = this;

        // validate incoming parameters
        Assert(SignMessageSchema, payload);

        const path = validatePath(payload.path);
        let coinInfo: BitcoinNetworkInfo | undefined;
        if (payload.coin) {
            coinInfo = getBitcoinNetwork(payload.coin);
            validateCoinPath(path, coinInfo);
        } else {
            coinInfo = getBitcoinNetwork(path);
        }

        // firmware range depends on used no_script_type parameter
        // no_script_type is possible since 1.10.4 / 2.4.3
        this.firmwareRange = getFirmwareRange(
            payload.no_script_type ? 'signMessageNoScriptType' : this.name,
            coinInfo,
            this.firmwareRange,
        );

        const messageHex = payload.hex
            ? messageToHex(payload.message)
            : Buffer.from(payload.message, 'utf8').toString('hex');
        const scriptType = getScriptType(path);
        this.params = {
            address_n: path,
            message: messageHex,
            coin_name: coinInfo ? coinInfo.name : undefined,
            script_type: scriptType && scriptType !== 'SPENDMULTISIG' ? scriptType : 'SPENDADDRESS', // script_type 'SPENDMULTISIG' throws Failure_FirmwareError
            no_script_type: payload.no_script_type,
        };
    }

    get info() {
        const coinInfo = getBitcoinNetwork(this.payload.coin ?? this.params.address_n);

        return getLabel('Sign #NETWORK message', coinInfo);
    }

    async run() {
        const cmd = this.device.getCommands();
        const { message } = await cmd.typedCall('SignMessage', 'MessageSignature', this.params);
        // convert signature to base64
        const signatureBuffer = Buffer.from(message.signature, 'hex');
        message.signature = signatureBuffer.toString('base64');

        return message;
    }
}
