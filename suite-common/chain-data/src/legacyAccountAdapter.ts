import type { Account } from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import type {
    ChainAccountBalance,
    ChainAccountRef,
} from '@trezor/network-module-suite-common-types';

import type { PortfolioAccount } from './PortfolioAccount';

type LegacyAccount = Pick<
    Account,
    | 'key'
    | 'symbol'
    | 'descriptor'
    | 'accountType'
    | 'deviceState'
    | 'backendType'
    | 'failed'
    | 'balance'
    | 'availableBalance'
    | 'formattedBalance'
    | 'empty'
>;

/**
 * The chain account behind a Redux account, or `null` for accounts that are not read from a chain
 * backend: failed accounts and CoinJoin accounts, which sync through their own coordinator.
 *
 * The wallet's identity is always passed along; each network decides whether its backend uses it.
 */
export const toChainAccountRef = (account: LegacyAccount): ChainAccountRef | null => {
    if (account.failed || account.backendType === 'coinjoin') return null;

    return {
        symbol: account.symbol,
        descriptor: account.descriptor,
        accountType: account.accountType,
        connectionIdentity: account.deviceState,
    };
};

/** Until accounts are stored as portfolio accounts, each Redux account is one on a single chain. */
export const toPortfolioAccount = (account: LegacyAccount): PortfolioAccount | null => {
    const ref = toChainAccountRef(account);

    return ref && { id: account.key, chainAccounts: [ref] };
};

/** The balance Redux last stored (and persisted for remembered wallets), to show before a fetch. */
export const toLastKnownBalance = (account: LegacyAccount): ChainAccountBalance => ({
    balance: formatNetworkAmount(account.balance, account.symbol),
    availableBalance: formatNetworkAmount(account.availableBalance, account.symbol),
    displayBalance: account.formattedBalance,
    empty: account.empty,
});
