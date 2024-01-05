import { PROTO } from '../../../constants';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getFirmwareRange } from '../../common/paramsValidator';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath } from '../../../utils/pathUtils';
import { transformAdditionalInfo } from '../additionalInfo';
import { Assert } from '@trezor/schema-utils';
import { SolanaSignTransaction as SolanaSignTransactionSchema } from '../../../types/api/solana';

export default class SolanaSignTransaction extends AbstractMethod<
    'solanaSignTransaction',
    PROTO.SolanaSignTx
> {
    init() {
        this.requiredPermissions = ['read', 'write'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Solana'),
            this.firmwareRange,
        );

        const { payload } = this;

        // validate bundle type
        Assert(SolanaSignTransactionSchema, payload);

        const path = validatePath(payload.path, 2);

        this.params = {
            address_n: path,
            serialized_tx: payload.serializedTx,
            additional_info: transformAdditionalInfo(payload.additionalInfo),
        };
    }

    get info() {
        return 'Sign Solana transaction';
    }

    async run() {
        const cmd = this.device.getCommands();
        const { message } = await cmd.typedCall('SolanaSignTx', 'SolanaTxSignature', this.params);
        return { signature: message.signature };
    }
}
