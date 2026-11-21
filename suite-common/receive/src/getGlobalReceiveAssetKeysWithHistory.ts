import { type AssetKey, getAssetKey, toTokenAddress } from '@suite-common/tokens';
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

type GetGlobalReceiveAssetKeysWithHistoryParams = {
    accounts: readonly Account[];
    networks: readonly Network[];
    transactions: GlobalReceiveTransactionHistory;
};

export const getGlobalReceiveAssetKeysWithHistory = ({
    accounts,
    networks,
    transactions,
}: GetGlobalReceiveAssetKeysWithHistoryParams): ReadonlySet<AssetKey> => {
    const assetKeys = new Set<AssetKey>();
    const networksBySymbol = new Map(networks.map(network => [network.symbol, network]));

    accounts.forEach(account => {
        const network = networksBySymbol.get(account.symbol);
        if (!network || network.testnet) {
            return;
        }

        const nativeAssetKey = getAssetKey({ networkSymbol: network.symbol });
        const { history } = account;
        // XRP and Stellar report an unknown total; their empty flag distinguishes unfunded accounts.
        const hasAccountHistory =
            history.total > 0 ||
            history.unconfirmed > 0 ||
            (history.tokens ?? 0) > 0 ||
            (history.total < 0 && !account.empty);
        if (hasAccountHistory) {
            assetKeys.add(nativeAssetKey);
        }

        account.tokens?.forEach(token => {
            const hasTokenHistory =
                ('transfers' in token &&
                    typeof token.transfers === 'number' &&
                    token.transfers > 0) ||
                new BigNumber(token.totalReceived ?? '0').gt(0) ||
                new BigNumber(token.totalSent ?? '0').gt(0);

            if (token.contract && hasTokenHistory) {
                assetKeys.add(
                    getAssetKey({
                        networkSymbol: account.symbol,
                        contractAddress: toTokenAddress(token.contract),
                    }),
                );
            }
        });

        // Fully spent tokens can disappear from account metadata but remain in cached transfers.
        transactions[account.key]?.forEach(transaction => {
            if (!transaction) {
                return;
            }

            assetKeys.add(nativeAssetKey);
            transaction.tokens.forEach(token => {
                if (token.contract) {
                    assetKeys.add(
                        getAssetKey({
                            networkSymbol: account.symbol,
                            contractAddress: toTokenAddress(token.contract),
                        }),
                    );
                }
            });
        });
    });

    return assetKeys;
};
