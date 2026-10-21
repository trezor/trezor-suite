import { type AccountInfo, type TokenInfo } from '@trezor/connect';

export const tokenReceiveToken = {
    name: 'USD Coin',
    symbol: 'USDC',
    contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    standard: 'ERC20',
    decimals: 6,
    balance: '10000000',
} satisfies TokenInfo;

export const tokenReceiveAccountInfo: AccountInfo = {
    descriptor: '0x0000000000000000000000000000000000000001',
    balance: '0',
    availableBalance: '0',
    empty: false,
    tokens: [tokenReceiveToken],
    history: {
        total: 0,
        unconfirmed: 0,
        transactions: [],
    },
    misc: { nonce: '0' },
};
