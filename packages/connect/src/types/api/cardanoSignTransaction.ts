import type { Params, Response } from '../params';
import type { CardanoSignTransaction, CardanoSignedTxData } from './cardano';

export declare function cardanoSignTransaction(
    params: Params<CardanoSignTransaction>,
): Response<CardanoSignedTxData>;

export declare function cardanoSignTransaction(
    params: Params<
        CardanoSignTransaction & {
            unsignedTx: { body: string; hash: string };
            testnet: boolean;
        }
    >,
): Response<CardanoSignedTxData & { serializedTx: string }>;
