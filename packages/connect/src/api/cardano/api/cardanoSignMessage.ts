import { AbstractMethod } from '../../../core/AbstractMethod';
import { PROTO, CARDANO, ERRORS } from '../../../constants';
import { getFirmwareRange } from '../../common/paramsValidator';
import { getMiscNetwork } from '../../../data/coinInfo';
import { Path } from '../cardanoInputs';
import { validatePath } from '../../../utils/pathUtils';
import { hexStringByteLength, sendChunkedHexString } from '../cardanoUtils';
import {
    CardanoSignMessage as CardanoSignMessageSchema,
    CardanoMessageHeaders,
    CardanoSignedMessage,
} from '../../../types/api/cardano';
import { addressParametersToProto } from '../cardanoAddressParameters';
import { Assert } from '@trezor/schema-utils';
import { hasHexPrefix, isHexString } from '../../../utils/formatUtils';

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
        const MAX_CHUNK_SIZE = 1024 * 2; // 1024 hex-encoded bytes

        await typedCall('CardanoSignMessageInit', 'CardanoMessageItemAck', {
            signing_path: this.params.signingPath,
            payload_size: payloadSize,
            hash_payload: this.params.hashPayload,
            network_id: this.params.networkId,
            protocol_magic: this.params.protocolMagic,
            address_parameters: this.params.addressParameters,
            display_ascii: this.params.displayAscii,
            derivation_type: this.params.derivationType,
        });

        await sendChunkedHexString(
            typedCall,
            this.params.payload,
            MAX_CHUNK_SIZE,
            'CardanoMessagePayloadChunk',
            'CardanoMessageItemAck',
        );

        const {
            message: { signature, address },
        } = await typedCall('CardanoMessageItemHostAck', 'CardanoSignMessageFinished');

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
