import { AssertWeak } from '@trezor/schema-utils';

import { PROTO } from '../../../constants';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getFirmwareRange } from '../../common/paramsValidator';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath } from '../../../utils/pathUtils';
import { transformAdditionalInfo } from '../additionalInfo';
import { createTransactionShimFromHex } from '../solanaUtils';
import { SolanaSignTransaction as SolanaSignTransactionSchema } from '../../../types/api/solana';

type Params = PROTO.SolanaSignTx & { serialize: boolean };

export default class SolanaSignTransaction extends AbstractMethod<'solanaSignTransaction', Params> {
    init() {
        this.requiredPermissions = ['read', 'write'];
        this.requiredDeviceCapabilities = ['Capability_Solana'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Solana'),
            this.firmwareRange,
        );

        const { payload } = this;

        // validate bundle type
        // TODO: weak assert for compatibility purposes (issue #10841)
        AssertWeak(SolanaSignTransactionSchema, payload);

        const path = validatePath(payload.path, 2);

        this.params = {
            address_n: path,
            serialized_tx: payload.serializedTx,
            additional_info: transformAdditionalInfo(payload.additionalInfo),
            serialize: !!payload.serialize,
        };
    }

    get info() {
        return 'Sign Solana transaction';
    }

    async run() {
        const cmd = this.device.getCommands();

        if (this.params.serialize) {
            const tx = await createTransactionShimFromHex(this.params.serialized_tx);

            const { message } = await cmd.typedCall('SolanaSignTx', 'SolanaTxSignature', {
                ...this.params,
                serialized_tx: tx.serializeMessage(),
            });

            const addressCall = await cmd.typedCall('SolanaGetAddress', 'SolanaAddress', {
                address_n: this.params.address_n,
                show_display: false,
                chunkify: false,
            });
            const { address } = addressCall.message;

            tx.addSignature(address, message.signature);
            const signedSerializedTx = tx.serialize();

            return { signature: message.signature, serializedTx: signedSerializedTx };
        }

        const { message } = await cmd.typedCall('SolanaSignTx', 'SolanaTxSignature', this.params);

        return { signature: message.signature };
    }
}
