import type { ServerInfo } from '@trezor/blockchain-link-types';

import { RIPPLE_DECIMALS } from './decimals';
import type { ServerInfoResponse } from '../types';

export const transformRippleServerInfo = (
    payload: ServerInfoResponse,
): Omit<ServerInfo, 'url'> => ({
    name: 'Ripple',
    shortcut: 'xrp',
    network: 'xrp',
    testnet: false,
    version: payload.result.info.build_version,
    decimals: RIPPLE_DECIMALS,
    blockHeight: payload.result.info.validated_ledger?.seq ?? 0,
    blockHash: payload.result.info.validated_ledger?.hash ?? '',
});
