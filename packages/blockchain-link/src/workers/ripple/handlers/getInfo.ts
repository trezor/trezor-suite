import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import { transformServerInfo } from '@trezor/blockchain-link-utils/src/ripple';
import xrpl from '@trezor/network-ripple/runtime';

import { RESERVE } from '../reserve';
import type { Request } from '../types';

export const getInfo = async (
    request: Request<MessageTypes.GetInfo>,
): Promise<Responses.GetInfo> => {
    const client = await request.connect();
    const response = await client.request({
        command: 'server_info',
    });

    // store current ledger values
    if (response.result.info.validated_ledger != null) {
        const { xrpToDrops } = await xrpl();
        RESERVE.BASE = xrpToDrops(response.result.info.validated_ledger.reserve_base_xrp);
        RESERVE.OWNER = xrpToDrops(response.result.info.validated_ledger.reserve_inc_xrp);
    }

    return {
        type: RESPONSES.GET_INFO,
        payload: {
            url: client.connection.getUrl(),
            ...transformServerInfo(response),
        },
    };
};
