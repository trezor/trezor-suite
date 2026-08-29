import type { MessageTypes } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import { STELLAR_DECIMALS } from '@trezor/network-stellar/constants';
import { BigNumber } from '@trezor/utils';

import { RESERVE } from '../reserve';
import type { Request } from '../types';
import { fetchLatestLedger } from '../utils';

export const getInfo = async (request: Request<MessageTypes.GetInfo>, isTestnet: boolean) => {
    const api = await request.connect();
    const horizonServerInfo = await api.root();
    const {
        sequence: blockHeight,
        hash: blockHash,
        base_reserve_in_stroops: baseReserveInStroops,
    } = await fetchLatestLedger(api);

    RESERVE.BASE = new BigNumber(baseReserveInStroops);

    const serverInfo = {
        url: api.serverURL.toString(),
        name: 'Stellar',
        shortcut: isTestnet ? 'txlm' : 'xlm',
        network: isTestnet ? 'txlm' : 'xlm',
        testnet: isTestnet,
        version: horizonServerInfo.horizon_version,
        decimals: STELLAR_DECIMALS,
        blockHeight,
        blockHash,
    };

    return {
        type: RESPONSES.GET_INFO,
        payload: { ...serverInfo },
    } as const;
};
