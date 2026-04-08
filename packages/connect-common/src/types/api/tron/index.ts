import { MessagesSchema as PROTO } from '@trezor/protobuf';
import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import { DerivationPath } from '../../params';

const TronTransferContract = Type.Object({
    type: Type.Literal('TransferContract'),
    parameter: Type.Object({
        value: PROTO.TronTransferContract,
    }),
});

const TronTriggerSmartContract = Type.Object({
    type: Type.Literal('TriggerSmartContract'),
    parameter: Type.Object({
        value: PROTO.TronTriggerSmartContract,
    }),
});

const TronFreezeBalanceV2Contract = Type.Object({
    type: Type.Literal('FreezeBalanceV2Contract'),
    parameter: Type.Object({
        value: PROTO.TronFreezeBalanceV2Contract,
    }),
});

const TronUnfreezeBalanceV2Contract = Type.Object({
    type: Type.Literal('UnfreezeBalanceV2Contract'),
    parameter: Type.Object({
        value: PROTO.TronUnfreezeBalanceV2Contract,
    }),
});

const TronWithdrawExpireUnfreezeContract = Type.Object({
    type: Type.Literal('WithdrawExpireUnfreezeContract'),
    parameter: Type.Object({
        value: PROTO.TronWithdrawUnfreeze,
    }),
});

const TronVoteWitnessContract = Type.Object({
    type: Type.Literal('VoteWitnessContract'),
    parameter: Type.Object({
        value: PROTO.TronVoteWitnessContract,
    }),
});

export type TronContracts = Static<typeof TronContracts>;
export const TronContracts = Type.Union([
    TronTransferContract,
    TronTriggerSmartContract,
    TronFreezeBalanceV2Contract,
    TronUnfreezeBalanceV2Contract,
    TronWithdrawExpireUnfreezeContract,
    TronVoteWitnessContract,
]);

export type TronContractsTypes = TronContracts['type'];

const TronFreezeBalanceV2ContractInput = Type.Object({
    type: Type.Literal('FreezeBalanceV2Contract'),
    parameter: Type.Object({
        value: Type.Union([
            Type.Object({
                owner_address: Type.String(),
                frozen_balance: Type.Number(),
                balance: Type.Optional(Type.Number()),
                resource: Type.Optional(PROTO.EnumTronResourceCode),
            }),
            PROTO.TronFreezeBalanceV2Contract,
        ]),
    }),
});

const TronUnfreezeBalanceV2ContractInput = Type.Object({
    type: Type.Literal('UnfreezeBalanceV2Contract'),
    parameter: Type.Object({
        value: Type.Union([
            Type.Object({
                owner_address: Type.String(),
                unfreeze_balance: Type.Number(),
                balance: Type.Optional(Type.Number()),
                resource: Type.Optional(PROTO.EnumTronResourceCode),
            }),
            PROTO.TronUnfreezeBalanceV2Contract,
        ]),
    }),
});

const TronVoteWitnessContractInput = Type.Object({
    type: Type.Literal('VoteWitnessContract'),
    parameter: Type.Object({
        value: Type.Union([
            Type.Object({
                owner_address: Type.String(),
                votes: Type.Array(
                    Type.Object({
                        vote_address: Type.String(),
                        vote_count: Type.Number(),
                    }),
                ),
            }),
            PROTO.TronVoteWitnessContract,
        ]),
    }),
});

export type TronContractInput = Static<typeof TronContractInput>;
export const TronContractInput = Type.Union([
    TronTransferContract,
    TronTriggerSmartContract,
    TronFreezeBalanceV2ContractInput,
    TronUnfreezeBalanceV2ContractInput,
    TronWithdrawExpireUnfreezeContract,
    TronVoteWitnessContractInput,
]);

export type TronSignTransaction = Static<typeof TronSignTransaction>;
export const TronSignTransaction = Type.Object({
    path: DerivationPath,
    ref_block_bytes: Type.String(),
    ref_block_hash: Type.String(),
    expiration: Type.Number(),
    timestamp: Type.Number(),
    fee_limit: Type.Optional(Type.Number()),
    data: Type.Optional(Type.String()),
    contract: Type.Array(TronContractInput, { length: 1 }),
});

export type TronSignedTx = Static<typeof TronSignedTx>;
export const TronSignedTx = Type.Object({
    signature: Type.String(),
    serializedTx: Type.Optional(Type.String()),
});

export type TronComposeTransaction = Static<typeof TronComposeTransaction>;
export const TronComposeTransaction = Type.Object({
    contract: TronContracts,
    blockHash: Type.String(),
    blockHeight: Type.Number(),
    fee_limit: Type.Optional(Type.Number()),
});

export type TronComposedTransaction = Static<typeof TronComposedTransaction>;
export const TronComposedTransaction = Type.Object({
    rawDataHex: Type.String(),
    ref_block_bytes: Type.String(),
    ref_block_hash: Type.String(),
    expiration: Type.Number(),
    timestamp: Type.Number(),
    bandwidth: Type.Number(),
});
