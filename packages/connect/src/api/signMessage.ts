// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/SignMessage.js

import type { BitcoinNetworkInfo } from '@trezor/connect-common';
import { SignMessage as SignMessageSchema } from '@trezor/connect-common';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getFirmwareRange, validateCoinPath } from './common/paramsValidator';
import { getBitcoinNetwork } from '../data/coinInfo';
import { validateModelOneMessageSize } from '../device/validateMessageSize';
import { hexToText, messageToHex } from '../utils/formatUtils';
import { getLabel, getScriptType, getSerializedPath, validatePath } from '../utils/pathUtils';

type Params = { proto: PROTO.SignMessage; readableMessage: string };

export default class SignMessage extends AbstractMethod<'signMessage', Params> {
    constructor(message: MethodMessage<'signMessage'>) {
        const { payload } = message;

        // validate incoming parameters
        Assert(SignMessageSchema, payload);

        const path = validatePath(payload.path);
        let coinInfo;
        if (payload.coin) {
            coinInfo = getBitcoinNetwork(payload.coin);
            validateCoinPath(path, coinInfo);
        } else {
            coinInfo = getBitcoinNetwork(path);
        }

        const messageHex = payload.hex
            ? messageToHex(payload.message)
            : Buffer.from(payload.message, 'utf8').toString('hex');

        const readableMessage = payload.hex ? hexToText(payload.message) : payload.message;

        const scriptType = getScriptType(path);
        const proto = {
            address_n: path,
            message: messageHex,
            coin_name: coinInfo ? coinInfo.name : undefined,
            script_type: scriptType && scriptType !== 'SPENDMULTISIG' ? scriptType : 'SPENDADDRESS', // script_type 'SPENDMULTISIG' throws Failure_FirmwareError
            no_script_type: payload.no_script_type,
        };

        const params = { proto, readableMessage };

        super(message, params);

        this.coinInfo = coinInfo;
        // firmware range depends on used no_script_type parameter
        // no_script_type is possible since 1.10.4 / 2.4.3
        this.firmwareRange = getFirmwareRange(
            payload.no_script_type ? 'signMessageNoScriptType' : this.name,
            this.coinInfo,
            this.firmwareRange,
        );
    }

    coinInfo: BitcoinNetworkInfo | undefined;

    get requiredPermissions(): MethodPermission[] {
        return ['read', 'write'];
    }

    get info() {
        return getLabel('Sign #NETWORK message', this.coinInfo);
    }

    getButtonRequestData(code: string, name?: string) {
        if (code === 'ButtonRequest_Other' && name === 'sign_message') {
            return {
                type: 'message' as const,
                serializedPath: getSerializedPath(this.params.proto.address_n),
                coin: this.coinInfo?.shortcut ?? 'BTC',
                message: this.params.readableMessage,
            };
        }
    }

    async run() {
        validateModelOneMessageSize(this.getDevice(), this.params.proto.message);

        const cmd = this.getDevice().getCommands();
        const { message } = await cmd.typedCall(
            'SignMessage',
            'MessageSignature',
            this.params.proto,
        );
        // convert signature to base64
        const signatureBuffer = Buffer.from(message.signature, 'hex');
        message.signature = signatureBuffer.toString('base64');

        return message;
    }
}
