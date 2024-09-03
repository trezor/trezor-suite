export const tokenIcons = {
    '0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b': require('../assets/tokenIcons/cro.svg'),
    '0x6b175474e89094c44da98b954eedeac495271d0f': require('../assets/tokenIcons/dai.svg'),
    '0x2af5d2ad76741191d15dfe7bf6ac92d4bd912ca3': require('../assets/tokenIcons/leo.svg'),
    '0x514910771af9ca656af840dff83e8264ecf986ca': require('../assets/tokenIcons/link.svg'),
    '0x75231f58b43240c9718dd58b4967c5114342a86c': require('../assets/tokenIcons/okb.svg'),
    '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce': require('../assets/tokenIcons/shib.svg'),
    '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': require('../assets/tokenIcons/uni.svg'),
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': require('../assets/tokenIcons/usdc.svg'),
    '0xdac17f958d2ee523a2206206994597c13d831ec7': require('../assets/tokenIcons/usdt.svg'),
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': require('../assets/tokenIcons/wbtc.svg'),
} as const;
export type TokenIconName = keyof typeof tokenIcons;

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const genericTokenIcon = require('../assets/tokenIcons/erc20.svg');
