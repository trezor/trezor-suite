import { bytesToHex } from '@noble/hashes/utils.js';

import { TronSignTransaction as TronSignTransactionSchema } from '@trezor/connect-common';
import type { PROTO, TronContracts, TronContractsTypes } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodPermission } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { validatePath } from '../../../utils/pathUtils';
import { encodeBroadcastTransaction, encodeTronContractRawData } from '../tronEncode';

const contractMapping = {
    TransferContract: 'TronTransferContract',
    TriggerSmartContract: 'TronTriggerSmartContract',
    FreezeBalanceV2Contract: 'TronFreezeBalanceV2Contract',
    UnfreezeBalanceV2Contract: 'TronUnfreezeBalanceV2Contract',
    WithdrawExpireUnfreezeContract: 'TronWithdrawUnfreeze',
    VoteWitnessContract: 'TronVoteWitnessContract',
} as const satisfies Record<TronContractsTypes, PROTO.MessageKey>;

type Params = {
    tx: PROTO.TronSignTx;
    contract: TronContracts;
};

export default class TronSignTransaction extends AbstractMethod<'tronSignTransaction', Params> {
    hasBundle?: boolean;
    progress = 0;

    constructor(message: MethodMessage<'tronSignTransaction'>) {
        super(message);
        this.requiredDeviceCapabilities = ['Capability_Tron'];
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read', 'write'];
    }

    init() {
        const { payload } = this;

        const contractType = payload.contract?.[0]?.type;
        if (!contractType || !(contractType in contractMapping)) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                `Unsupported Tron contract type: ${contractType ?? 'undefined'}`,
            );
        }

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
            contract: payload.contract[0],
        };
    }

    get info() {
        return 'Sign Tron transaction';
    }

    async run() {
        const cmd = this.getDevice().getCommands();

        await cmd.typedCall('TronSignTx', 'TronContractRequest', this.params.tx);

        const { message } = await cmd.typedCall(
            contractMapping[this.params.contract.type],
            'TronSignature',
            this.params.contract.parameter.value,
        );

        const { signature } = message;

        let serializedTx: string | undefined;
        try {
            const rawData = encodeTronContractRawData(this.params.contract, this.params.tx);
            serializedTx = encodeBroadcastTransaction(bytesToHex(rawData), signature);
        } catch {
            // unsupported contract type
        }

        return { signature, serializedTx };
    }
}
