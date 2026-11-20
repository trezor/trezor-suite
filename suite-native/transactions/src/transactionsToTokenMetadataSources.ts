import { type TokenMetadataSource } from '@suite-common/token';
import { type WalletAccountTransaction } from '@suite-native/tokens';

export const transactionsToTokenMetadataSources = (
    transactions: readonly WalletAccountTransaction[],
): TokenMetadataSource[] =>
    transactions.map(transaction => ({
        networkSymbol: transaction.symbol,
        tokens: transaction.tokens,
    }));
