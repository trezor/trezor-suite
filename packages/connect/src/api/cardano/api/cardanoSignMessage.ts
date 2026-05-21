import cardano from '@trezor/coins-cardano/runtime';
import { CARDANO, type MethodPermission } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import {
    type CardanoMessageHeaders,
    CardanoSignMessage as CardanoSignMessageSchema,
    type CardanoSignedMessage,
} from '@trezor/connect-common/src/types/api/cardano';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { hasHexPrefix, isHexString } from '../../../utils/formatUtils';
import { validatePath } from '../../../utils/pathUtils';
import { addressParametersToProto } from '../cardanoAddressParameters';
import type { Path } from '../cardanoInputs';
import { hexStringByteLength } from '../cardanoUtils';

export type CardanoSignMessageParams = {
    path: Path;
    payload: string;
    preferHexDisplay: boolean;
    networkId?: number;
    protocolMagic?: number;
    addressParameters?: PROTO.CardanoAddressParametersType;
    derivationType: PROTO.CardanoDerivationType;
};

export default class CardanoSignMessage extends AbstractMethod<
    'cardanoSignMessage',
    CardanoSignMessageParams
> {
    static readonly VERSION = 1;

    constructor(message: MethodMessage<'cardanoSignMessage'>) {
        const { payload } = message;

        Assert(CardanoSignMessageSchema, payload);

        if (
            !isHexString(payload.payload) ||
            hasHexPrefix(payload.payload) ||
            payload.payload.length % 2 !== 0
        ) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                'Message payload must be a byte-aligned hexadecimal string (even number of characters) without a "0x" prefix.',
            );
        }

        const params = {
            path: validatePath(payload.path, 5),
            payload: payload.payload,
            preferHexDisplay: payload.preferHexDisplay ?? false,
            networkId: payload.networkId,
            protocolMagic: payload.protocolMagic,
            addressParameters:
                payload.addressParameters && addressParametersToProto(payload.addressParameters),
            derivationType: payload.derivationType ?? PROTO.CardanoDerivationType.ICARUS_TREZOR,
        };

        super(message, params);

        this.requiredFirmwareCoins = [getMiscNetwork('Cardano')];
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read', 'write'];
    }

    async run(): Promise<CardanoSignedMessage> {
        const typedCall = this.getDevice()
            .getCommands()
            .typedCall.bind(this.getDevice().getCommands());
        const payloadSize = hexStringByteLength(this.params.payload);

        let response = await typedCall(
            'CardanoSignMessageInit',
            ['CardanoMessageSignature', 'CardanoMessageDataRequest'],
            {
                signing_path: this.params.path,
                payload_size: payloadSize,
                network_id: this.params.networkId,
                protocol_magic: this.params.protocolMagic,
                address_parameters: this.params.addressParameters,
                prefer_hex_display: this.params.preferHexDisplay,
                derivation_type: this.params.derivationType,
            },
        );
        while (response.type !== 'CardanoMessageSignature') {
            const { length, offset } = response.message;
            const data = this.params.payload.slice(offset * 2, (offset + length) * 2); // *2 due to hex encoding
            response = await typedCall(
                'CardanoMessageDataResponse',
                ['CardanoMessageSignature', 'CardanoMessageDataRequest'],
                { data },
            );
        }
        const { signature, address, pub_key } = response.message;

        const { createCose } = await cardano();

        return {
            signature,
            payload: this.params.payload,
            headers: this._createHeaders(address),
            pubKey: pub_key,
            ...createCose(this.params.payload, signature, address, pub_key),
        };
    }

    _createHeaders(address: string): CardanoMessageHeaders {
        return {
            protected: {
                1: CARDANO.ALGORITHM_IDS.EdDSA,
                address,
            },
            unprotected: {
                hashed: false,
                version: CardanoSignMessage.VERSION,
            },
        };
    }

    get info() {
        return 'Sign Cardano message';
    }
}
