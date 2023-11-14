import { A, D, F, pipe } from '@mobily/ts-belt';
import type {
    TokenDetailByMint,
} from '@trezor/blockchain-link-types/lib/solana';
import type { TokenInfo } from '@trezor/blockchain-link-types/lib';

export type ApiTokenAccount = { account: AccountInfo<ParsedAccountData>; pubkey: PublicKey };

// Docs regarding solana programs: https://spl.solana.com/
// Token program docs: https://spl.solana.com/token
export const TOKEN_PROGRAM_PUBLIC_KEY = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

export const getTokenNameAndSymbol = (mint: string, tokenDetailByMint: TokenDetailByMint) => {
    const tokenDetail = tokenDetailByMint[mint.toLowerCase()];

    return tokenDetail
        ? { name: tokenDetail.name, symbol: tokenDetail.symbol }
        : {
              name: mint,
              symbol: `${mint.slice(0, 3)}...`,
          };
};

export const transformTokenInfo = (
    tokenAccounts: ApiTokenAccount[],
    tokenDetailByMint: TokenDetailByMint,
) => {
    const tokens: TokenInfo[] = F.toMutable(
        pipe(
            tokenAccounts,
            A.map((tokenAccount: ApiTokenAccount): TokenInfo & { address: string } => {
                const { info } = tokenAccount.account.data.parsed;

                return {
                    type: 'SPL', // Designation for Solana tokens
                    contract: info.mint,
                    balance: info.tokenAmount.amount,
                    decimals: info.tokenAmount.decimals,
                    ...getTokenNameAndSymbol(info.mint, tokenDetailByMint),
                    address: tokenAccount.pubkey.toString(),
                };
            }),
            A.reduce(
                {},
                (acc: { [mint: string]: TokenInfo }, token: TokenInfo & { address: string }) => {
                    if (acc[token.contract] != null) {
                        acc[token.contract].balance = new BigNumber(
                            acc[token.contract].balance || '0',
                        )
                            .plus(token.balance || '0')
                            .toString();
                        acc[token.contract].accounts!.push({
                            publicKey: token.address,
                            balance: token.balance || '0',
                        });
                    } else {
                        const { type, contract, balance, decimals, name, symbol } = token;
                        acc[token.contract] = {
                            type,
                            contract,
                            balance,
                            decimals,
                            name,
                            symbol,
                            accounts: [{ publicKey: token.address, balance: balance || '0' }],
                        };
                    }

                    return acc;
                },
            ),
            D.values,
        ),
    );

    return tokens;
};

