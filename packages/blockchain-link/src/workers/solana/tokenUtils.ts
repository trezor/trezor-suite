import { TokenDetailByMint } from '@trezor/blockchain-link-types/lib/solana';

const TOKEN_WHITELIST = {
    So11111111111111111111111111111111111111112: {
        name: 'Wrapped SOL',
        symbol: 'WSOL',
    },
    Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: {
        name: 'Tether',
        symbol: 'USDT',
    },
    '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': {
        name: 'Raydium',
        symbol: 'RAY',
    },
};

export const getTokenMetadata = async (): Promise<TokenDetailByMint> =>
    Promise.resolve(TOKEN_WHITELIST);
