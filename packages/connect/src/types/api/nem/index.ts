import { PROTO, NEM } from '../../../constants';
import { DerivationPath } from '../../params';
import { Type, Static } from '@trezor/schema-utils';

// NEM types from nem-sdk
// https://nemproject.github.io/#transferTransaction

export type MosaicID = Static<typeof MosaicID>;
export const MosaicID = Type.Object({
    namespaceId: Type.String(),
    name: Type.String(),
});

export type MosaicDefinition = Static<typeof MosaicDefinition>;
export const MosaicDefinition = Type.Object({
    levy: Type.Optional(
        Type.Object({
            type: Type.Optional(PROTO.EnumNEMMosaicLevy),
            fee: Type.Optional(Type.Number()),
            recipient: Type.Optional(Type.String()),
            mosaicId: Type.Optional(MosaicID),
        }),
    ),
    id: MosaicID,
    description: Type.String(),
    properties: Type.Optional(
        Type.Array(
            Type.Object({
                name: Type.Union([
                    Type.Literal('divisibility'),
                    Type.Literal('initialSupply'),
                    Type.Literal('supplyMutable'),
                    Type.Literal('transferable'),
                ]),
                value: Type.String(),
            }),
        ),
    ),
});

export type NEMMosaic = Static<typeof NEMMosaic>;
export const NEMMosaic = Type.Object({
    mosaicId: MosaicID,
    quantity: Type.Number(),
});

export type Modification = Static<typeof Modification>;
export const Modification = Type.Object({
    modificationType: PROTO.EnumNEMModificationType,
    cosignatoryAccount: Type.String(),
});

export type Message = Static<typeof Message>;
export const Message = Type.Object({
    payload: Type.Optional(Type.String()),
    type: Type.Optional(Type.Number()),
    publicKey: Type.Optional(Type.String()), // not present in sdk
});

export type TransactionCommon = Static<typeof TransactionCommon>;
export const TransactionCommon = Type.Object({
    version: Type.Union([NEM.EnumTxVersion, Type.Number()]), // users may potentially want to use any arbitrary chain
    timeStamp: Type.Number(),
    fee: Type.Number(),
    deadline: Type.Number(),
    signer: Type.Optional(Type.String()),
});

export type NEMTransferTransaction = Static<typeof NEMTransferTransaction>;
export const NEMTransferTransaction = Type.Intersect([
    TransactionCommon,
    Type.Object({
        type: Type.Literal(NEM.TxType.TRANSFER),
        recipient: Type.String(),
        amount: Type.Uint(),
        mosaics: Type.Optional(Type.Array(NEMMosaic)),
        message: Type.Optional(Message),
    }),
]);

export type NEMImportanceTransaction = Static<typeof NEMImportanceTransaction>;
export const NEMImportanceTransaction = Type.Intersect([
    TransactionCommon,
    Type.Object({
        type: Type.Literal(NEM.TxType.IMPORTANCE_TRANSFER),
        importanceTransfer: Type.Object({
            mode: PROTO.EnumNEMImportanceTransferMode,
            publicKey: Type.String(),
        }),
    }),
]);

export type NEMAggregateModificationTransaction = Static<
    typeof NEMAggregateModificationTransaction
>;
export const NEMAggregateModificationTransaction = Type.Intersect([
    TransactionCommon,
    Type.Object({
        type: Type.Literal(NEM.TxType.AGGREGATE_MODIFICATION),
        modifications: Type.Optional(Type.Array(Modification)),
        minCosignatories: Type.Object({
            relativeChange: Type.Number(),
        }),
    }),
]);

export type NEMProvisionNamespaceTransaction = Static<typeof NEMProvisionNamespaceTransaction>;
export const NEMProvisionNamespaceTransaction = Type.Intersect([
    TransactionCommon,
    Type.Object({
        type: Type.Literal(NEM.TxType.PROVISION_NAMESPACE),
        newPart: Type.String(),
        parent: Type.Optional(Type.String()),
        rentalFeeSink: Type.String(),
        rentalFee: Type.Number(),
    }),
]);

export type NEMMosaicCreationTransaction = Static<typeof NEMMosaicCreationTransaction>;
export const NEMMosaicCreationTransaction = Type.Intersect([
    TransactionCommon,
    Type.Object({
        type: Type.Literal(NEM.TxType.MOSAIC_CREATION),
        mosaicDefinition: MosaicDefinition,
        creationFeeSink: Type.String(),
        creationFee: Type.Number(),
    }),
]);

export type NEMSupplyChangeTransaction = Static<typeof NEMSupplyChangeTransaction>;
export const NEMSupplyChangeTransaction = Type.Intersect([
    TransactionCommon,
    Type.Object({
        type: Type.Literal(NEM.TxType.SUPPLY_CHANGE),
        mosaicId: MosaicID,
        supplyType: PROTO.EnumNEMSupplyChangeType,
        delta: Type.Number(),
    }),
]);

export type NEMRegularTransaction = Static<typeof NEMRegularTransaction>;
export const NEMRegularTransaction = Type.Union([
    NEMTransferTransaction,
    NEMImportanceTransaction,
    NEMAggregateModificationTransaction,
    NEMProvisionNamespaceTransaction,
    NEMMosaicCreationTransaction,
    NEMSupplyChangeTransaction,
]);

export type NEMMultisigTransaction = Static<typeof NEMMultisigTransaction>;
export const NEMMultisigTransaction = Type.Intersect([
    TransactionCommon,
    Type.Object({
        type: Type.Union([
            Type.Literal(NEM.TxType.COSIGNING),
            Type.Literal(NEM.TxType.MULTISIG),
            Type.Literal(NEM.TxType.MULTISIG_SIGNATURE),
        ]),
        otherTrans: NEMRegularTransaction,
    }),
]);

export type NEMTransaction = Static<typeof NEMTransaction>;
export const NEMTransaction = Type.Union([NEMRegularTransaction, NEMMultisigTransaction]);

export type NEMSignTransaction = Static<typeof NEMSignTransaction>;
export const NEMSignTransaction = Type.Object({
    path: DerivationPath,
    transaction: NEMTransaction,
    chunkify: Type.Optional(Type.Boolean()),
});
