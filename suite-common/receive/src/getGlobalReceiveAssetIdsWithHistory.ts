import { getCryptoId } from '@suite-common/trading';
import { type Network } from '@suite-common/wallet-config';
import {
    type Account,
    type AccountKey,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

type GlobalReceiveTransactionHistory = Readonly<
    Partial<
        Record<AccountKey, readonly (Pick<WalletAccountTransaction, 'tokens'> | null | undefined)[]>
    >
>;

type GetGlobalReceiveAssetIdsWithHistoryParams = {
    accounts: readonly Account[];
    networks: readonly Network[];
    transactions: GlobalReceiveTransactionHistory;
};

export const getGlobalReceiveAssetIdsWithHistory = ({
    accounts,
    networks,
    transactions,
}: GetGlobalReceiveAssetIdsWithHistoryParams): ReadonlySet<string> => {
    const assetIds = new Set<string>();
    const networksBySymbol = new Map(networks.map(network => [network.symbol, network]));

    accounts.forEach(account => {
        const network = networksBySymbol.get(account.symbol);
        if (!network?.tradeCryptoId || network.testnet) {
            return;
        }

        const nativeAssetId = network.tradeCryptoId;
        const { history } = account;
        // XRP and Stellar report an unknown total; their empty flag distinguishes unfunded accounts.
        const hasAccountHistory =
            history.total > 0 ||
            history.unconfirmed > 0 ||
            (history.tokens ?? 0) > 0 ||
            (history.total < 0 && !account.empty);
        if (hasAccountHistory) {
            assetIds.add(nativeAssetId);
        }

        account.tokens?.forEach(token => {
            const hasTokenHistory =
                ('transfers' in token &&
                    typeof token.transfers === 'number' &&
                    token.transfers > 0) ||
                new BigNumber(token.totalReceived ?? '0').gt(0) ||
                new BigNumber(token.totalSent ?? '0').gt(0);

            if (token.contract && hasTokenHistory) {
                assetIds.add(getCryptoId(account.symbol, token.contract));
            }
        });

        // Fully spent tokens can disappear from account metadata but remain in cached transfers.
        transactions[account.key]?.forEach(transaction => {
            if (!transaction) {
                return;
            }

            assetIds.add(nativeAssetId);
            transaction.tokens.forEach(token => {
                if (token.contract) {
                    assetIds.add(getCryptoId(account.symbol, token.contract));
                }
            });
        });
    });

    return assetIds;
};
