import { exhaustive } from '@trezor/type-utils';
import { isUrlWithQuery, parseElectrumUrl } from '@trezor/utils';

import type { NetworkSymbol, ServerType } from './types';

export const getServerAddressExample = (networkSymbol: NetworkSymbol, serverType: ServerType) => {
    switch (serverType) {
        case 'blockbook':
        case 'solana':
        case 'stellar':
        case 'evm-rpc':
            return `https://${networkSymbol}.trezor.io`;
        case 'blockfrost':
        case 'ripple':
            return `wss://${networkSymbol}.trezor.io`;
        case 'electrum':
            return `electrum.example.com:50002:s`;
        case 'coinjoin':
        case 'default':
            return undefined;
        default:
            return exhaustive(serverType);
    }
};

export const validateServerAddress = (type: ServerType | undefined, value: string) => {
    if (type === 'electrum') {
        return !!parseElectrumUrl(value);
    }

    return isUrlWithQuery(value);
};
