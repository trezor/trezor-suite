import { createPublicClient } from 'viem';

import { CustomError, RESPONSES } from '@trezor/blockchain-link-types';
import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';

import type { Request } from '../types';
import { getTransportType } from '../utils/transportType';

export const getEvmChainId = async (
    request: Request<MessageTypes.GetEvmChainId>,
): Promise<Responses.GetEvmChainId> => {
    const { url } = request.payload;

    const transportType = getTransportType(url);

    if (!transportType) {
        throw new CustomError('invalid_param', 'Invalid URL');
    }

    const client = createPublicClient({
        transport: transportType(url, {
            timeout: 5000,
        }),
    });

    const chainId = await client.getChainId();

    return {
        type: RESPONSES.GET_EVM_CHAIN_ID,
        payload: Number(chainId),
    };
};
