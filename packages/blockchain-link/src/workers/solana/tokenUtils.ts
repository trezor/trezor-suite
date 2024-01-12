import * as BufferLayout from '@solana/buffer-layout';
import { Connection, PublicKey } from '@solana/web3.js';
import type { Metadata } from '@metaplex-foundation/mpl-token-metadata';
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

// https://docs.metaplex.com/programs/token-metadata/changelog/v1.0#token-metadata-program
const getTokenMetaPDA = async (mint: string): Promise<PublicKey> => {
    const { PROGRAM_ID } = await import('@metaplex-foundation/mpl-token-metadata');
    return (
        await PublicKey.findProgramAddress(
            [
                Buffer.from('metadata'),
                new PublicKey(PROGRAM_ID).toBuffer(),
                new PublicKey(mint).toBuffer(),
            ],
            new PublicKey(PROGRAM_ID),
        )
    )[0];
};

const replaceNullCharacters = (str: string): string => str.replace(/\0/g, '');

export const fetchMetaplexMetadata = async (
    api: Connection,
    mintBundle: string[],
): Promise<TokenDetailByMint> => {
    try {
        const tokenMetaPubkeyBundle = await Promise.all(
            mintBundle.map(mint => getTokenMetaPDA(mint)),
        );

        const { Metadata } = await import('@metaplex-foundation/mpl-token-metadata');
        const metadataBundle = (
            await Promise.all(
                tokenMetaPubkeyBundle.map(metaPubKey =>
                    Metadata.fromAccountAddress(api, metaPubKey).catch(() => null),
                ),
            )
        ).filter((meta): meta is Metadata => meta !== null);

        return metadataBundle.reduce((acc, meta) => {
            const { mint, data } = meta;
            return {
                ...acc,
                [mint.toString()]: {
                    name: replaceNullCharacters(data.name),
                    symbol: replaceNullCharacters(data.symbol),
                },
            };
        }, {} as TokenDetailByMint);
    } catch (e) {
        return {};
    }
};
