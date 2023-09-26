import { TokenDetailByMint } from '@trezor/blockchain-link-types/lib/solana';

// https://github.com/viaprotocol/tokenlists
// Aggregated token list with tokens listed on multiple exchanges
const solanaTokenListUrl =
    'https://cdn.jsdelivr.net/gh/viaprotocol/tokenlists/all_tokens/solana.json';

export const getTokenMetadata = async (): Promise<TokenDetailByMint> => {
    const tokenListResult: { address: string; name: string; symbol: string }[] = await (
        await fetch(solanaTokenListUrl)
    ).json();

    const tokenMap = tokenListResult.reduce(
        (acc, token) => ({
            [token.address]: {
                name: token.name,
                symbol: token.symbol,
            },
            ...acc,
        }),
        {} as TokenDetailByMint,
    );

    return tokenMap;
};
