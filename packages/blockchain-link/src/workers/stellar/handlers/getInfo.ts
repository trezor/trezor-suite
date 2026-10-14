import type { MessageTypes } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import { STELLAR_DECIMALS } from '@trezor/network-stellar/constants';
import stellar from '@trezor/network-stellar/runtime';

import type { Request } from '../types';

export const getInfo = async (request: Request<MessageTypes.GetInfo>, isTestnet: boolean) => {
    const api = await request.connect();
    const { createStellarDataSource } = await stellar();

    // Every other request waits on this handshake, so it must survive an RPC outage.
    const dataSource = createStellarDataSource(api);

    const [version, { sequence: blockHeight, hash: blockHash }] = await Promise.all([
        dataSource.readVersion(),
        dataSource.readLatestLedger(),
    ]);

    return {
        type: RESPONSES.GET_INFO,
        payload: {
            url: api.url,
            name: 'Stellar',
            shortcut: isTestnet ? 'txlm' : 'xlm',
            network: isTestnet ? 'txlm' : 'xlm',
            testnet: isTestnet,
            version,
            decimals: STELLAR_DECIMALS,
            blockHeight,
            blockHash,
        },
    } as const;
};
