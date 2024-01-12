import * as BufferLayout from '@solana/buffer-layout';
import { TokenDetailByMint } from 'packages/blockchain-link-types/lib/solana';

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

// a proxy for https://api.coingecko.com/api/v3
const getCoingeckoTokenDetailUrl = (mint: string) =>
    `https://cdn.trezor.io/dynamic/coingecko/api/v3/coins/solana/contract/${mint}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`;

type TokenDetail = {
    name: string;
    symbol: string;
};

const isTokenDetail = (data: any): data is TokenDetail =>
    data &&
    'name' in data &&
    typeof data.name === 'string' &&
    'symbol' in data &&
    typeof data.symbol === 'string';

const fetchTokenDetail = async (mint: string): Promise<TokenDetail | null> =>
    (await fetch(getCoingeckoTokenDetailUrl(mint))).json().then((data: any) => {
        if (isTokenDetail(data)) {
            return data;
        }
        return null;
    });

export const fetchCoingeckoTokenDetailByMint = async (
    mintBundle: string[],
): Promise<TokenDetailByMint> => {
    try {
        const metadataBundle = (
            await Promise.all(
                mintBundle.map(async mint => {
                    const detail = await fetchTokenDetail(mint).catch(() => null);
                    return detail
                        ? {
                              mint,
                              detail,
                          }
                        : null;
                }),
            )
        ).filter(
            (detailWithMint): detailWithMint is { mint: string; detail: TokenDetail } =>
                detailWithMint !== null,
        );

        const result = metadataBundle.reduce((acc, meta) => {
            const { mint, detail } = meta;
            return {
                ...acc,
                [mint]: {
                    name: detail.name,
                    symbol: detail.symbol,
                },
            };
        }, {} as TokenDetailByMint);
        return result;
    } catch (e) {
        return {};
    }
};
