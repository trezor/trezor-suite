import { Static, Type } from '@trezor/schema-utils';

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

export type TronContracts = Static<typeof TronContracts>;
export const TronContracts = Type.Union([TronTransferContract, TronTriggerSmartContract]);

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
