import { trezorUtils } from '@fivebinaries/coin-selection';
import TrezorConnect, {
    CardanoSignTransaction,
    CardanoSignedTxData,
    Params,
    Response,
} from '@trezor/connect';

interface CardanoSignTransactionNew {
    (params: Params<CardanoSignTransaction>): Response<CardanoSignedTxData>;
    (
        params: Params<
            CardanoSignTransaction & {
                unsignedTx: { body: string; hash: string };
                testnet: boolean;
            }
        >,
    ): Response<CardanoSignedTxData & { serializedTx: string }>;
}

export const cardanoSignTransaction: CardanoSignTransactionNew = async params => {
    const { unsignedTx, testnet, ...rest } = {
        unsignedTx: undefined,
        testnet: undefined,
        ...params,
    };

    const response = await TrezorConnect.cardanoSignTransaction(rest);

    if (!response.success) return response;
    if (!unsignedTx) return response as any;

    const { hash, witnesses } = response.payload;

    // TODO this check not in staking?
    if (hash !== unsignedTx.hash) {
        return {
            success: false,
            payload: {
                error: "Constructed transaction doesn't match the hash returned by the device.", // TODO
            },
        };
    }

    const serializedTx = trezorUtils.signTransaction(unsignedTx.body, witnesses, { testnet });

    return {
        success: true,
        payload: {
            ...response.payload,
            serializedTx,
        },
    };
};
