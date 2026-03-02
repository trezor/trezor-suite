import * as cbor from 'cbor';

import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import { CARDANO, PROTO } from '../../../constants';
import { AbstractMethod, MethodPermission, Payload } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import type { Device } from '../../../device/Device';
import {
    CardanoMessageHeaders,
    CardanoSignMessage as CardanoSignMessageSchema,
    CardanoSignedMessage,
} from '../../../types/api/cardano';
import { hasHexPrefix, isHexString } from '../../../utils/formatUtils';
import { validatePath } from '../../../utils/pathUtils';
import { getFirmwareRange } from '../../common/paramsValidator';
import { addressParametersToProto } from '../cardanoAddressParameters';
import { Path } from '../cardanoInputs';
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

    constructor(message: { id?: number; payload: Payload<'cardanoSignMessage'> }) {
        super(message);
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Cardano'),
            this.firmwareRange,
        );
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read', 'write'];
    }

    init(): void {
        const { payload } = this;

        Assert(CardanoSignMessageSchema, payload);

        if (!isHexString(payload.payload) || hasHexPrefix(payload.payload)) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                'Message payload must be a hexadecimal string without a "0x" prefix.',
            );
        }

        this.params = {
            path: validatePath(payload.path, 5),
            payload: payload.payload,
            preferHexDisplay: payload.preferHexDisplay ?? false,
            networkId: payload.networkId,
            protocolMagic: payload.protocolMagic,
            addressParameters:
                payload.addressParameters && addressParametersToProto(payload.addressParameters),
            derivationType: payload.derivationType ?? PROTO.CardanoDerivationType.ICARUS_TREZOR,
        };
    }

    async run(device: Device): Promise<CardanoSignedMessage> {
        const { typedCall } = device.getCommands();
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

        return {
            signature,
            payload: this.params.payload,
            headers: this._createHeaders(address),
            pubKey: pub_key,
            ...this._createCose(this.params.payload, signature, address, pub_key),
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

    _createCose(payload: string, signature: string, address: string, pubKey: string) {
        const coseSignature = cbor.encode([
            Buffer.from(
                cbor.encode(
                    new Map()
                        .set(1, -8) // alg: EdDSA
                        .set('address', Buffer.from(address, 'hex')),
                ),
            ),
            new Map().set('hashed', false),
            Buffer.from(payload, 'hex'),
            Buffer.from(signature, 'hex'),
        ]);
        const coseKey = cbor.encode(
            new Map()
                .set(1, 1) // kty: OKP
                .set(3, -8) // alg: EdDSA
                .set(-1, 6) // crv: Ed25519
                .set(-2, Buffer.from(pubKey, 'hex')),
        );

        return {
            coseSignature: Buffer.from(coseSignature).toString('hex'),
            coseKey: Buffer.from(coseKey).toString('hex'),
        };
    }

    get info() {
        return 'Sign Cardano message';
    }
}
