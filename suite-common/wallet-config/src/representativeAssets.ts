import { type NetworkSymbol } from './types';

export type RepresentativeAsset = {
    symbol: string;
    contract?: string;
};

const representativeAssets: Partial<Record<NetworkSymbol, readonly RepresentativeAsset[]>> = {
    btc: [{ symbol: 'BTC' }],
    eth: [
        { symbol: 'ETH' },
        { symbol: 'USDC', contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
        { symbol: 'USDT', contract: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
        { symbol: 'LINK', contract: '0x514910771af9ca656af840dff83e8264ecf986ca' },
        { symbol: 'UNI', contract: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984' },
    ],
    pol: [
        { symbol: 'POL' },
        { symbol: 'USDC', contract: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359' },
        { symbol: 'AAVE', contract: '0xd6df932a45c0f255f85145f286ea0b292b21c90b' },
        { symbol: 'QUICK', contract: '0x831753dd7087cac61ab5644b308642cc1c33dc13' },
        { symbol: 'WETH', contract: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619' },
    ],
    bsc: [
        { symbol: 'BNB' },
        { symbol: 'USDT', contract: '0x55d398326f99059ff775485246999027b3197955' },
        { symbol: 'CAKE', contract: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82' },
        { symbol: 'XRP', contract: '0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe' },
        { symbol: 'BTCB', contract: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c' },
    ],
    arb: [
        { symbol: 'ARB', contract: '0x912ce59144191c1204e64559fe8253a0e49e6548' },
        { symbol: 'USDC', contract: '0xaf88d065e77c8cc2239327c5edb3a432268e5831' },
        { symbol: 'GMX', contract: '0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a' },
        { symbol: 'LINK', contract: '0xf97f4df75117a78c1a5a0dbb814af92458539fb4' },
        { symbol: 'WETH', contract: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1' },
    ],
    base: [
        { symbol: 'ETH' },
        { symbol: 'USDC', contract: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' },
        { symbol: 'cbBTC', contract: '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf' },
        { symbol: 'AERO', contract: '0x940181a94a35a4569e4529a3cdfb74e38fd98631' },
        { symbol: 'USDT', contract: '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2' },
    ],
    op: [
        { symbol: 'OP', contract: '0x4200000000000000000000000000000000000042' },
        { symbol: 'USDC', contract: '0x0b2c639c533813f4aa9d7837caf62653d097ff85' },
        { symbol: 'SNX', contract: '0x8700daec35af8ff88c16bdf0418774cb3d7599b4' },
        { symbol: 'VELO', contract: '0x9560e827af36c94d2ac33a39bce1fe78631088db' },
        { symbol: 'WETH', contract: '0x4200000000000000000000000000000000000006' },
    ],
    avax: [
        { symbol: 'AVAX' },
        { symbol: 'USDC', contract: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e' },
        { symbol: 'JOE', contract: '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd' },
        { symbol: 'BTC.b', contract: '0x152b9d0fdc40c096757f570a51e494bd4b943e50' },
        { symbol: 'QI', contract: '0x8729438eb15e2c8b576fcc6aecda6a148776c0f5' },
    ],
    sol: [
        { symbol: 'SOL' },
        { symbol: 'USDC', contract: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
        { symbol: 'JUP', contract: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' },
        { symbol: 'BONK', contract: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
        { symbol: 'PYTH', contract: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3' },
    ],
    ada: [
        { symbol: 'ADA' },
        {
            symbol: 'DJED',
            contract:
                '8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61446a65644d6963726f555344',
        },
        {
            symbol: 'SNEK',
            contract: '279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f534e454b',
        },
        {
            symbol: 'IAG',
            contract: '5d16cc1a177b5d9ba9cfa9793b07e60f1fb70fea1f8aef064415d114494147',
        },
        {
            symbol: 'WMTx',
            contract:
                'e5a42a1a1d3d1da71b0449663c32798725888d2eb0843c4dabeca05a576f726c644d6f62696c65546f6b656e58',
        },
    ],
    etc: [
        { symbol: 'ETC' },
        { symbol: 'WETC', contract: '0x1953cab0e5bFa6D4a9BaD6E05fD46C1CC6527a5a' },
        { symbol: 'USC', contract: '0xde093684c796204224bc081f937aa059d903c52a' },
    ],
    xlm: [
        { symbol: 'XLM' },
        {
            symbol: 'USDC',
            contract: 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        },
        {
            symbol: 'AQUA',
            contract: 'AQUA-GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA',
        },
        {
            symbol: 'yBTC',
            contract: 'yBTC-GBUVRNH4RW4VLHP4C5MOF46RRIRZLAVHYGX45MVSTKA2F6TMR7E7L6NW',
        },
        {
            symbol: 'EURC',
            contract: 'EURC-GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2',
        },
    ],
    trx: [
        { symbol: 'TRX' },
        { symbol: 'USDT', contract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' },
        { symbol: 'BTT', contract: 'TAFjULxiVgT4qWk6UZwjqwZXTSaGaqnVp4' },
        { symbol: 'JST', contract: 'TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9' },
        { symbol: 'USDD', contract: 'TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz' },
    ],
    xrp: [{ symbol: 'XRP' }],
    ltc: [{ symbol: 'LTC' }],
    bch: [{ symbol: 'BCH' }],
    doge: [{ symbol: 'DOGE' }],
    zec: [{ symbol: 'ZEC' }],
} as const;

export const getRepresentativeAssets = (
    networkSymbol: NetworkSymbol,
): readonly RepresentativeAsset[] => representativeAssets[networkSymbol] ?? [];
