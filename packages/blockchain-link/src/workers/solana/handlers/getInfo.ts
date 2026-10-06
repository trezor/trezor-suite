import type { MessageTypes } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import { SOLANA_DECIMALS } from '@trezor/network-solana/constants';

import type { Request } from '../types';

export const getInfo = async (request: Request<MessageTypes.GetInfo>, isTestnet: boolean) => {
    const api = await request.connect();

    const {
        value: { blockhash: blockHash, lastValidBlockHeight: blockHeight },
    } = await api.rpc.getLatestBlockhash({ commitment: 'confirmed' }).send();

    const serverInfo = {
        testnet: isTestnet,
        blockHeight: Number(blockHeight),
        blockHash,
        shortcut: isTestnet ? 'dsol' : 'sol',
        network: isTestnet ? 'dsol' : 'sol',
        url: api.clusterUrl,
        name: 'Solana',
        version: '1', // saving request api.rpc.getVersion().send(), version is not used anyways
        decimals: SOLANA_DECIMALS,
    };

    return {
        type: RESPONSES.GET_INFO,
        payload: { ...serverInfo },
    } as const;
};
