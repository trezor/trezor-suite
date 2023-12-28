import { Assert } from '@trezor/schema-utils';

import { CARDANO, ERRORS, PROTO } from '../../../constants';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
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
import { hexStringByteLength, sendChunkedHexString } from '../cardanoUtils';

export type CardanoSignMessageParams = {
    signingPath: Path;
    payload: string;
    hashPayload: boolean;
    displayAscii: boolean;
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

    init(): void {
        this.requiredPermissions = ['read', 'write'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Cardano'),
            this.firmwareRange,
        );

        const { payload } = this;

        Assert(CardanoSignMessageSchema, payload);

        if (!isHexString(payload.payload) || hasHexPrefix(payload.payload)) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                'Message payload must be a hexadecimal string without a "0x" prefix.',
            );
        }

        this.params = {
            signingPath: validatePath(payload.signingPath, 5),
            payload: payload.payload,
            hashPayload: payload.hashPayload,
            displayAscii: payload.displayAscii,
            networkId: payload.networkId,
            protocolMagic: payload.protocolMagic,
            addressParameters:
                payload.addressParameters && addressParametersToProto(payload.addressParameters),
            derivationType: payload.derivationType ?? PROTO.CardanoDerivationType.ICARUS_TREZOR,
        };
    }

    async run(): Promise<CardanoSignedMessage> {
        const typedCall = this.device.getCommands().typedCall.bind(this.device.getCommands());
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
        };
    }

    _createHeaders(address: string): CardanoMessageHeaders {
        return {
            protected: {
                1: CARDANO.ALGORITHM_IDS.EdDSA,
                address,
            },
            unprotected: {
                hashed: this.params.hashPayload,
                version: CardanoSignMessage.VERSION,
            },
        };
    }

    get info() {
        return 'Sign Cardano message';
    }
}
