// Docs regarding solana programs: https://spl.solana.com/
// Token program docs: https://spl.solana.com/token
export const TOKEN_PROGRAM_PUBLIC_KEY = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
// Token 2022 program docs: https://spl.solana.com/token-2022
export const TOKEN_2022_PROGRAM_PUBLIC_KEY = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
// Associated token program docs: https://spl.solana.com/associated-token-account
export const ASSOCIATED_TOKEN_PROGRAM_PUBLIC_KEY = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
// System program docs: https://docs.solana.com/developing/runtime-facilities/programs#system-program
export const SYSTEM_PROGRAM_PUBLIC_KEY = '11111111111111111111111111111111';
// WSOL transfers are denoted as transfers of SOL as well as WSOL, so we use this to filter out SOL values
// when parsing tx effects.
export const WSOL_MINT = 'So11111111111111111111111111111111111111112';
export const STAKE_PROGRAM_PUBLIC_KEY = 'Stake11111111111111111111111111111111111111';
export const COMPUTE_BUDGET_PROGRAM_ID = 'ComputeBudget111111111111111111111111111111';
export const SERUM_ASSET_OWNER_PROGRAM_ID = '4MNPdKu9wFMvEeZBMt3Eipfs5ovVWTJb31pEXDJAAxX5';
export const SERUM_ASSET_OWNER_PHANTOM_DEPLOYMENT_PROGRAM_ID =
    'DeJBGdMFa1uynnnKiwrVioatTuHmNLpyFKnmB5kaFdzQ';
export const MEMO_PROGRAM_PUBLIC_KEY = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
export const MEMO_PROGRAM_PUBLIC_KEY_V1 = 'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo';

export const MAX_DEACTIVATE_ACCOUNTS_WITH_SPLIT = 16;
export const MAX_DEACTIVATE_ACCOUNTS = 22;
export const MAX_CLAIM_ACCOUNTS = 16;
export const MIN_AMOUNT = 10000000; // 0.01 SOL

export const tokenProgramNames = ['spl-token', 'spl-token-2022'] as const;

export const tokenProgramsInfo = {
    'spl-token': {
        publicKey: TOKEN_PROGRAM_PUBLIC_KEY,
        tokenStandard: 'SPL',
    },
    'spl-token-2022': {
        publicKey: TOKEN_2022_PROGRAM_PUBLIC_KEY,
        tokenStandard: 'SPL-2022',
    },
} as const;

export const supportedSolanaNetworkSymbols = ['sol', 'dsol'] as const;

export enum Network {
    Mainnet = 'mainnet-beta',
    Devnet = 'devnet',
}
