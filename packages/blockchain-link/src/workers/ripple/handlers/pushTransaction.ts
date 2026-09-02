import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';

import type { Request } from '../types';

export const pushTransaction = async ({
    connect,
    payload,
}: Request<MessageTypes.PushTransaction>): Promise<Responses.PushTransaction> => {
    const client = await connect();
    // tx_blob hex must be in upper case
    const info = await client.submit(payload.hex.toUpperCase());

    if (info.result.engine_result === 'tesSUCCESS' && info.result.tx_json.hash) {
        return {
            type: RESPONSES.PUSH_TRANSACTION,
            payload: info.result.tx_json.hash,
        };
    }
    throw new Error(info.result.engine_result_message);
};
