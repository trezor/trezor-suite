// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/nemSignTx.js

import { PROTO, ERRORS, NEM } from '../../constants';
import * as $T from '../../types/api/nem';

const getCommon = (tx: $T.NEMTransaction, address_n?: number[]): PROTO.NEMTransactionCommon => ({
    address_n,
    network: (tx.version >> 24) & 0xff,
    timestamp: tx.timeStamp,
    fee: tx.fee,
    deadline: tx.deadline,
    signer: address_n ? undefined : tx.signer,
});

const transferMessage = (tx: $T.NEMTransferTransaction): PROTO.NEMTransfer => {
    const mosaics = tx.mosaics
        ? tx.mosaics.map(mosaic => ({
              namespace: mosaic.mosaicId.namespaceId,
              mosaic: mosaic.mosaicId.name,
              quantity: mosaic.quantity,
          }))
        : undefined;

    return {
        recipient: tx.recipient,
        amount: tx.amount,
        payload: tx.message ? tx.message.payload : undefined,
        public_key: tx.message && tx.message.type === 0x02 ? tx.message.publicKey : undefined,
        mosaics,
    };
};

const importanceTransferMessage = (
    tx: $T.NEMImportanceTransaction,
): PROTO.NEMImportanceTransfer => ({
    mode: tx.importanceTransfer.mode,
    public_key: tx.importanceTransfer.publicKey,
});

const aggregateModificationMessage = (
    tx: $T.NEMAggregateModificationTransaction,
): PROTO.NEMAggregateModification => {
    const modifications = tx.modifications
        ? tx.modifications.map(modification => ({
              type: modification.modificationType,
              public_key: modification.cosignatoryAccount,
          }))
        : undefined;

    return {
        modifications,
        relative_change: tx.minCosignatories.relativeChange,
    };
};

const provisionNamespaceMessage = (
    tx: $T.NEMProvisionNamespaceTransaction,
): PROTO.NEMProvisionNamespace => ({
    namespace: tx.newPart,
    parent: tx.parent,
    sink: tx.rentalFeeSink,
    fee: tx.rentalFee,
});

const mosaicCreationMessage = (tx: $T.NEMMosaicCreationTransaction): PROTO.NEMMosaicCreation => {
    const { levy } = tx.mosaicDefinition;

    const definition: PROTO.NEMMosaicDefinition = {
        namespace: tx.mosaicDefinition.id.namespaceId,
        mosaic: tx.mosaicDefinition.id.name,
        levy: levy && levy.type,
        fee: levy && levy.fee,
        levy_address: levy && levy.recipient,
        levy_namespace: levy && levy.mosaicId && levy.mosaicId.namespaceId,
        levy_mosaic: levy && levy.mosaicId && levy.mosaicId.name,
        description: tx.mosaicDefinition.description,
    };

    const { properties } = tx.mosaicDefinition;
    if (Array.isArray(properties)) {
        properties.forEach(property => {
            const { name, value } = property;
            switch (name) {
                case 'divisibility':
                    definition.divisibility = parseInt(value, 10);
                    break;

                case 'initialSupply':
                    definition.supply = parseInt(value, 10);
                    break;

                case 'supplyMutable':
                    definition.mutable_supply = value === 'true';
                    break;

                case 'transferable':
                    definition.transferable = value === 'true';
                    break;

                // no default
            }
        });
    }

    return {
        definition,
        sink: tx.creationFeeSink,
        fee: tx.creationFee,
    };
};

const supplyChangeMessage = (tx: $T.NEMSupplyChangeTransaction): PROTO.NEMMosaicSupplyChange => ({
    namespace: tx.mosaicId.namespaceId,
    mosaic: tx.mosaicId.name,
    type: tx.supplyType,
    delta: tx.delta,
});

export const createTx = (tx: $T.NEMTransaction, address_n: number[], chunkify?: boolean) => {
    let transaction = tx;
    const message: PROTO.NEMSignTx = {
        chunkify: typeof chunkify === 'boolean' ? chunkify : false,
        transaction: getCommon(tx, address_n),
        transfer: undefined,
        importance_transfer: undefined,
        aggregate_modification: undefined,
        provision_namespace: undefined,
        mosaic_creation: undefined,
        supply_change: undefined,
    };

    if (
        tx.type === NEM.TxType.COSIGNING ||
        tx.type === NEM.TxType.MULTISIG ||
        tx.type === NEM.TxType.MULTISIG_SIGNATURE
    ) {
        message.cosigning =
            tx.type === NEM.TxType.COSIGNING || tx.type === NEM.TxType.MULTISIG_SIGNATURE;
        transaction = tx.otherTrans;
        message.multisig = getCommon(transaction);
    }

    switch (transaction.type) {
        case NEM.TxType.TRANSFER:
            message.transfer = transferMessage(transaction);
            break;

        case NEM.TxType.IMPORTANCE_TRANSFER:
            message.importance_transfer = importanceTransferMessage(transaction);
            break;

        case NEM.TxType.AGGREGATE_MODIFICATION:
            message.aggregate_modification = aggregateModificationMessage(transaction);
            break;

        case NEM.TxType.PROVISION_NAMESPACE:
            message.provision_namespace = provisionNamespaceMessage(transaction);
            break;

        case NEM.TxType.MOSAIC_CREATION:
            message.mosaic_creation = mosaicCreationMessage(transaction);
            break;

        case NEM.TxType.SUPPLY_CHANGE:
            message.supply_change = supplyChangeMessage(transaction);
            break;

        default:
            throw ERRORS.TypedError('Method_InvalidParameter', 'Unknown transaction type');
    }

    return message;
};
