import type {
    CardanoSignTransaction,
    CardanoSignTransactionExtended,
    CardanoSignedTxData,
} from './common';
import type { Params, Response } from '../../params';

export declare function cardanoSignTransaction(
    params: Params<CardanoSignTransaction & { unsignedTx?: undefined; testnet?: undefined }>, // Explicitly distinguish type
): Response<CardanoSignedTxData>;

export declare function cardanoSignTransaction(
    params: Params<CardanoSignTransactionExtended>,
): Response<CardanoSignedTxData & { serializedTx: string }>;
