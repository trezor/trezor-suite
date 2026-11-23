import { type Account } from '@suite-common/wallet-types';
import { isUtxoBased } from '@suite-common/wallet-utils';

/**
 * Whether the asset-first experiment gives the account its asset overview, and the header that goes
 * with it. A Privacy (coinjoin) account keeps the overview it had: its mixing lives in its own tab.
 */
export const hasAccountAssetOverview = (account: Account) => account.backendType !== 'coinjoin';

/**
 * Whether the account is one address, which its header can show. A UTXO account spreads over many
 * and its descriptor is an xpub, so its overview shows the coin it holds instead.
 */
export const isAccountOneAddress = (account: Account) => !isUtxoBased(account);
