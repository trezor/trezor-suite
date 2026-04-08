import { bytesToHex } from '@noble/hashes/utils.js';

import {
    type PROTO,
    type TronContractInput,
    type TronContracts,
    type TronContractsTypes,
    TronSignTransaction as TronSignTransactionSchema,
} from '@trezor/connect-common';
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

        const contract = this.transformContract(payload.contract[0]);

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
            contract,
        };
    }

    // Transform official Tron field names to protobuf field names.
    private transformContract(input: TronContractInput): TronContracts {
        switch (input.type) {
            case 'FreezeBalanceV2Contract': {
                const { value } = input.parameter;

                return {
                    type: 'FreezeBalanceV2Contract',
                    parameter: {
                        value: {
                            owner_address: value.owner_address,
                            balance:
                                'frozen_balance' in value ? value.frozen_balance : value.balance,
                            resource: value.resource,
                        },
                    },
                };
            }
            case 'UnfreezeBalanceV2Contract': {
                const { value } = input.parameter;

                return {
                    type: 'UnfreezeBalanceV2Contract',
                    parameter: {
                        value: {
                            owner_address: value.owner_address,
                            balance:
                                'unfreeze_balance' in value
                                    ? value.unfreeze_balance
                                    : value.balance,
                            resource: value.resource,
                        },
                    },
                };
            }
            case 'VoteWitnessContract': {
                const { value } = input.parameter;

                return {
                    type: 'VoteWitnessContract',
                    parameter: {
                        value: {
                            owner_address: value.owner_address,
                            votes: value.votes.map(vote => ({
                                address: 'vote_address' in vote ? vote.vote_address : vote.address,
                                count: 'vote_count' in vote ? vote.vote_count : vote.count,
                            })),
                        },
                    },
                };
            }
            case 'TransferContract':
            case 'TriggerSmartContract':
            case 'WithdrawExpireUnfreezeContract':
                return input;
        }
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
