// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/SignMessage.js

import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import { AbstractMethod, MethodPermission } from '../core/AbstractMethod';
import type { BitcoinNetworkInfo } from '../types';
import { SignMessage as SignMessageSchema } from '../types';
import { getFirmwareRange, validateCoinPath } from './common/paramsValidator';
import { getBitcoinNetwork } from '../data/coinInfo';
import { validateModelOneMessageSize } from '../device/validateMessageSize';
import { hexToText, messageToHex } from '../utils/formatUtils';
import { getLabel, getScriptType, getSerializedPath, validatePath } from '../utils/pathUtils';

export default class SignMessage extends AbstractMethod<'signMessage', PROTO.SignMessage> {
    coinInfo: BitcoinNetworkInfo | undefined;

    get requiredPermissions(): MethodPermission[] {
        return ['read', 'write'];
    }

    init() {
        const { payload } = this;

        // validate incoming parameters
        Assert(SignMessageSchema, payload);

        if (!payload.path) {
            if (!payload.address) {
                throw new Error("signMessage: either 'path' or 'address' parameter is required");
            }

            // Address-only call: set up minimal state for getMethodInfo().
            // The preCallHook will resolve address to path, and init() will run again
            // with the resolved path on the actual device call.
            if (payload.coin) {
                this.coinInfo = getBitcoinNetwork(payload.coin);
            }
            this.firmwareRange = getFirmwareRange(this.name, this.coinInfo, this.firmwareRange);
            this.params = {
                address_n: [],
                message: '',
                coin_name: this.coinInfo?.name,
                script_type: 'SPENDADDRESS',
                no_script_type: payload.no_script_type,
            };

            return;
        }

        const path = validatePath(payload.path);
        if (payload.coin) {
            this.coinInfo = getBitcoinNetwork(payload.coin);
            validateCoinPath(path, this.coinInfo);
        } else {
            this.coinInfo = getBitcoinNetwork(path);
        }

        // firmware range depends on used no_script_type parameter
        // no_script_type is possible since 1.10.4 / 2.4.3
        this.firmwareRange = getFirmwareRange(
            payload.no_script_type ? 'signMessageNoScriptType' : this.name,
            this.coinInfo,
            this.firmwareRange,
        );

        const messageHex = payload.hex
            ? messageToHex(payload.message)
            : Buffer.from(payload.message, 'utf8').toString('hex');
        const scriptType = getScriptType(path);
        this.params = {
            address_n: path,
            message: messageHex,
            coin_name: this.coinInfo ? this.coinInfo.name : undefined,
            script_type: scriptType && scriptType !== 'SPENDMULTISIG' ? scriptType : 'SPENDADDRESS', // script_type 'SPENDMULTISIG' throws Failure_FirmwareError
            no_script_type: payload.no_script_type,
        };
    }

    get info() {
        const coinInfo = getBitcoinNetwork(this.payload.coin ?? this.params.address_n);

        return getLabel('Sign #NETWORK message', coinInfo);
    }

    getButtonRequestData(code: string, name?: string) {
        if (code === 'ButtonRequest_Other' && name === 'sign_message') {
            return {
                type: 'message' as const,
                serializedPath: getSerializedPath(this.params.address_n),
                coin: this.coinInfo?.shortcut ?? 'BTC',
                message: this.payload.hex ? hexToText(this.payload.message) : this.payload.message,
            };
        }
    }

    async run() {
        validateModelOneMessageSize(this.device, this.params.message);

        const cmd = this.device.getCommands();
        const { message } = await cmd.typedCall('SignMessage', 'MessageSignature', this.params);
        // convert signature to base64
        const signatureBuffer = Buffer.from(message.signature, 'hex');
        message.signature = signatureBuffer.toString('base64');

        return message;
    }
}
