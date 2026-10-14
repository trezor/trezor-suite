/**
 * Contracts Circle publishes for Arc, merged into the Arc definitions whatever CoinGecko lists, so
 * they stay verified even if CoinGecko drops or misplaces one of them.
 *
 * Lowercase, because Suite lowercases an EVM contract before looking it up in the definitions.
 *
 * @see https://docs.arc.io/arc/references/contract-addresses
 */
const ARC_OFFICIAL_TOKENS: readonly string[] = [
    '0x3600000000000000000000000000000000000000', // USDC
    '0xbef5f6d51cb62b58e6a8f77868681825c6fe21c1', // EURC
    '0x171a4217b86a807a64eb94757db6849fb4bdbaa0', // cirBTC
    '0x128cc466b61f542da60c70e3aa11c10e19b84edb', // WETH
];

export const getArcOfficialTokens = (): readonly string[] => ARC_OFFICIAL_TOKENS;
