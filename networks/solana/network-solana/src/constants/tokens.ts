import type { TokenDetailByMint, TokenInfo } from '@trezor/blockchain-link-types';
import { isCodesignBuild } from '@trezor/env-utils';
import { BigNumber, isArrayMember } from '@trezor/utils';

import { WSOL_MINT, tokenProgramNames, tokenProgramsInfo } from './common';
import type { AccountInfo, Address, ParsedAccountData, TokenProgramName } from '../types';

export type ApiTokenAccount = {
    account: AccountInfo<ParsedAccountData>;
    pubkey: Address;
};

export const getSolanaTokenMetadata = async (): Promise<TokenDetailByMint> => {
    const env = isCodesignBuild() ? 'stable' : 'develop';

    const response = await fetch(
        `https://data.trezor.io/suite/definitions/${env}/solana.advanced.coin.definitions.v1.json`,
    );

    if (!response.ok) {
        throw Error(response.statusText);
    }

    const data: TokenDetailByMint = await response.json();

    // Explicitly set Wrapped SOL symbol to wSol instead of the official 'SOL' which leads to confusion in UI
    data[WSOL_MINT] = { symbol: 'wSOL', name: 'Wrapped SOL' };

    return data;
};

export const getTokenNameAndSymbol = (mint: string, tokenDetailByMint: TokenDetailByMint) => {
    const tokenDetail = tokenDetailByMint[mint];

    return tokenDetail
        ? { name: tokenDetail.name, symbol: tokenDetail.symbol }
        : {
              name: mint,
              symbol: mint,
          };
};

export const isTokenProgramName = (programName: string): programName is TokenProgramName =>
    isArrayMember(programName, tokenProgramNames);

type SplTokenAccountData = {
    /** Name of the program that owns this account */
    program: TokenProgramName;
    /** Parsed account data */
    parsed: {
        info: {
            mint: string;
            tokenAmount: {
                amount: string;
                decimals: number;
            };
        };
        type: string;
    };
    /** Space used by account data */
    space: bigint;
};

type SplTokenAccount = { account: AccountInfo<SplTokenAccountData>; pubkey: Address };

const isSplTokenAccount = (tokenAccount: ApiTokenAccount): tokenAccount is SplTokenAccount => {
    const { parsed } = tokenAccount.account.data;

    return (
        isTokenProgramName(tokenAccount.account.data.program) &&
        'info' in parsed &&
        !!parsed.info &&
        'mint' in parsed.info &&
        typeof parsed.info.mint === 'string' &&
        'tokenAmount' in parsed.info &&
        !!parsed.info.tokenAmount &&
        typeof parsed.info.tokenAmount === 'object' &&
        'amount' in parsed.info.tokenAmount &&
        typeof parsed.info.tokenAmount.amount === 'string' &&
        'decimals' in parsed.info.tokenAmount &&
        typeof parsed.info.tokenAmount.decimals === 'number'
    );
};

export const transformSolanaTokenInfo = (
    tokenAccounts: readonly ApiTokenAccount[],
    tokenDetailByMint: TokenDetailByMint,
) => {
    const acc: { [mint: string]: TokenInfo } = {};
    // since ApiTokenAccount type is not precise enough, we type-guard the account to make sure they contain all the necessary data
    for (const tokenAccount of tokenAccounts) {
        if (!isSplTokenAccount(tokenAccount)) continue;
        const {
            parsed: { info },
            program,
        } = tokenAccount.account.data;
        const token = {
            type: tokenProgramsInfo[program].tokenStandard,
            contract: info.mint,
            balance: info.tokenAmount.amount,
            decimals: info.tokenAmount.decimals,
            ...getTokenNameAndSymbol(info.mint, tokenDetailByMint),
            address: tokenAccount.pubkey,
            standard: tokenProgramsInfo[program].tokenStandard,
        };
        const existing = acc[token.contract];
        if (existing != null) {
            existing.balance = new BigNumber(existing.balance || '0')
                .plus(token.balance || '0')
                .toString();
            existing.accounts?.push({
                publicKey: token.address,
                balance: token.balance || '0',
            });
        } else {
            const { standard, contract, balance, decimals, name, symbol } = token;
            acc[token.contract] = {
                standard,
                contract,
                balance,
                decimals,
                name,
                symbol,
                accounts: [{ publicKey: token.address, balance: balance || '0' }],
            };
        }
    }
    const tokens: TokenInfo[] = Object.values(acc);

    return tokens;
};
