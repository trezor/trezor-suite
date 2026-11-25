import type { CoinInfo } from '@trezor/connect-common';

import { getCustomBlockchainLink } from './BlockchainLink';

const coinInfo = {
    shortcut: 'ETH',
    type: 'ethereum',
    blockchainLink: { type: 'blockbook', url: ['default'] },
} as CoinInfo;

const broadcast = { type: 'evm-rpc', url: ['broadcast'] };

describe(getCustomBlockchainLink.name, () => {
    it('keeps the default backend when no custom backend is given', () => {
        expect(getCustomBlockchainLink(coinInfo, undefined)).toEqual(coinInfo.blockchainLink);
    });

    it('uses the custom backend with its broadcast backend', () => {
        const custom = { type: 'evm-rpc', url: ['custom'], broadcast };

        expect(getCustomBlockchainLink(coinInfo, custom)).toEqual(custom);
    });

    it('adds a custom broadcast backend to the default backend', () => {
        expect(
            getCustomBlockchainLink(coinInfo, { type: 'blockbook', url: [], broadcast }),
        ).toEqual({ type: 'blockbook', url: ['default'], broadcast });
    });

    it('drops an empty broadcast backend', () => {
        expect(
            getCustomBlockchainLink(coinInfo, {
                type: 'blockbook',
                url: [],
                broadcast: { type: 'evm-rpc', url: [] },
            }),
        ).toEqual(coinInfo.blockchainLink);
    });
});
