import { createPublicClient } from 'viem';

import { RESPONSES } from '@trezor/blockchain-link-types/src/constants';
import { CustomError } from '@trezor/blockchain-link-types/src/constants/errors';
import type * as MessageTypes from '@trezor/blockchain-link-types/src/messages';
import type * as Responses from '@trezor/blockchain-link-types/src/responses';

import type { Request } from '../types';
import { getTransportType } from '../utils/transportType';

export const validateRpcUrl = async (
    request: Request<MessageTypes.ValidateEvmRpc>,
): Promise<Responses.ValidateEvmRpc> => {
    const { url, chainId: expectedChainId } = request.payload;

    const transportType = getTransportType(url);

    if (!transportType) {
        throw new CustomError('invalid_param', 'Invalid URL');
    }

    const client = createPublicClient({
        transport: transportType(url, {
            timeout: 5000,
        }),
    });

    const actualChainId = await client.getChainId();

    const valid = Number(actualChainId) === expectedChainId;

    return {
        type: RESPONSES.VALIDATE_EVM_RPC,
        payload: {
            valid,
            actualChainId: Number(actualChainId),
        },
    };
};
