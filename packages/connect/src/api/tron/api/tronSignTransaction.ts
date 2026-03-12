import { Assert } from '@trezor/schema-utils';

import { PROTO } from '../../../constants';
import { AbstractMethod, MethodContext, MethodMessage, MethodPermission } from '../../../core/AbstractMethod';
import {
    TronContractsParameters,
    TronContractsTypes,
    TronSignTransaction as TronSignTransactionSchema,
} from '../../../types/api/tron';
import { validatePath } from '../../../utils/pathUtils';

type Params = {
    tx: PROTO.TronSignTx;
    contractType: TronContractsTypes;
    contract: TronContractsParameters;
};

export default class TronSignTransaction extends AbstractMethod<'tronSignTransaction', Params> {
    hasBundle?: boolean;
    progress = 0;

    constructor(message: MethodMessage<'tronSignTransaction'>, context: MethodContext) {
        super(message, context);
        this.requiredDeviceCapabilities = ['Capability_Tron'];
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read', 'write'];
    }

    init() {
        const { payload } = this;
        Assert(TronSignTransactionSchema, payload);

        const path = validatePath(payload.path, 3);

        this.params = {
            tx: {
                address_n: path,
                ref_block_bytes: payload.ref_block_bytes,
                ref_block_hash: payload.ref_block_hash,
                expiration: payload.expiration,
                timestamp: payload.timestamp,
                fee_limit: payload.fee_limit,
                data: payload.data,
            },
            contractType: payload.contract[0].type,
            contract: payload.contract[0].parameter.value,
        };
    }

    get info() {
        return 'Sign Tron transaction';
    }

    async run() {
        const cmd = this.getDevice().getCommands();

        await cmd.typedCall('TronSignTx', 'TronContractRequest', this.params.tx);

        const contractMapping = {
            TransferContract: 'TronTransferContract',
            TriggerSmartContract: 'TronTriggerSmartContract',
            FreezeBalanceV2Contract: 'TronFreezeBalanceV2Contract',
            UnfreezeBalanceV2Contract: 'TronUnfreezeBalanceV2Contract',
            WithdrawExpireUnfreezeContract: 'TronWithdrawUnfreeze',
        } as const;

        const { message } = await cmd.typedCall(
            contractMapping[this.params.contractType],
            'TronSignature',
            this.params.contract,
        );

        return { signature: message.signature };
    }
}
