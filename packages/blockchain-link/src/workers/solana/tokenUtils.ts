import * as BufferLayout from '@solana/buffer-layout';

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
