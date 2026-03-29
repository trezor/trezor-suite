import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import { PROTO } from '../../../constants';
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

export type TronContracts = Static<typeof TronContracts>;
export const TronContracts = Type.Union([
    TronTransferContract,
    TronTriggerSmartContract,
    TronFreezeBalanceV2Contract,
    TronUnfreezeBalanceV2Contract,
    TronWithdrawExpireUnfreezeContract,
]);

export type TronContractsTypes = TronContracts['type'];
export type TronContractsParameters = TronContracts['parameter']['value'];

export type TronSignTransaction = Static<typeof TronSignTransaction>;
export const TronSignTransaction = Type.Object({
    path: DerivationPath,
    ref_block_bytes: Type.String(),
    ref_block_hash: Type.String(),
    expiration: Type.Number(),
    timestamp: Type.Number(),
    fee_limit: Type.Optional(Type.Number()),
    data: Type.Optional(Type.String()),
    contract: Type.Array(TronContracts, { length: 1 }),
});

export type TronSignedTx = Static<typeof TronSignedTx>;
export const TronSignedTx = Type.Object({
    signature: Type.String(),
});

export type TronComposeTransaction = Static<typeof TronComposeTransaction>;
export const TronComposeTransaction = Type.Object({
    from: Type.String(),
    to: Type.String(),
    amount: Type.String(), // in SUN for native TRX, token subunits for TRC-20
    blockHash: Type.String(),
    blockHeight: Type.Number(),
    token: Type.Optional(
        Type.Object({
            contract: Type.String(),
            data: Type.String(), // calldata hex (without 0x)
            feeLimit: Type.Optional(Type.Number()), // in SUN; absent means no fee_limit field in tx
        }),
    ),
});

export type TronComposedTransaction = Static<typeof TronComposedTransaction>;
export const TronComposedTransaction = Type.Object({
    rawDataHex: Type.String(),
    ref_block_bytes: Type.String(),
    ref_block_hash: Type.String(),
    expiration: Type.Number(),
    timestamp: Type.Number(),
});
