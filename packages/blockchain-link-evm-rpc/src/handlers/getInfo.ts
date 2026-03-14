import { RESPONSES } from '@trezor/blockchain-link-types/src/constants';
import type * as MessageTypes from '@trezor/blockchain-link-types/src/messages';
import type * as Responses from '@trezor/blockchain-link-types/src/responses';

import type { Request } from '../types';

export const getInfo = async (
    request: Request<MessageTypes.GetInfo>,
): Promise<Responses.GetInfo> => {
    const client = await request.connect();
    const [blockNumber, chainId] = await Promise.all([
        client.getBlockNumber(),
        client.getChainId(),
    ]);

    const block = await client.getBlock({ blockNumber, includeTransactions: false });

    const { coinName } = request;

    return {
        type: RESPONSES.GET_INFO,
        payload: {
            url: request.state.url ?? '',
            name: `EVM RPC (Chain ${chainId})`,
            shortcut: coinName,
            decimals: 18,
            blockHeight: Number(blockNumber),
            blockHash: block?.hash || '',
            testnet: false,
            version: '1.0.0',
            network: coinName,
        },
    };
};
