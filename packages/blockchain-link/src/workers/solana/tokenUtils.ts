import * as BufferLayout from '@solana/buffer-layout';
import { TokenDetailByMint } from '@trezor/blockchain-link-types/lib/solana';

// This type is required to construct the TOKEN_ACCOUNT_LAYOUT,
// See: https://stackoverflow.com/questions/72413915/encoding-typescript-lib-solana-buffer-layout
interface TokenAccountLayout {
    mint: string;
    owner: string;
    amount: number;
    rest: Uint8Array;
}

export const TOKEN_ACCOUNT_LAYOUT = BufferLayout.struct<TokenAccountLayout>([
    BufferLayout.blob(32, 'mint'),
    BufferLayout.blob(32, 'owner'),
    BufferLayout.nu64('amount'),
    BufferLayout.blob(93),
]);

const WSOL_MINT_LOWERCASE = 'so11111111111111111111111111111111111111112';

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
            [token.address.toLowerCase()]: {
                name: token.name,
                symbol: token.symbol,
            },
            ...acc,
        }),
        {} as TokenDetailByMint,
    );

    // Explicitly set Wrapped SOL symbol to WSOL instead of the official 'SOL' which leads to confusion in UI
    tokenMap[WSOL_MINT_LOWERCASE].symbol = 'WSOL';

    return tokenMap;
};
