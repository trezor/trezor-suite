import { AssetFirstHomeExperiment } from '@trezor/suite';

import { AccountAssetsPage } from './AccountAssetsPage';
import { TransactionsPage } from './TransactionsPage';

/** The account's Overview tab, as Home is switched: the page as it was, or the asset-first one. */
export const AccountOverviewPage = () => (
    <AssetFirstHomeExperiment asItWas={<TransactionsPage />} assetFirst={<AccountAssetsPage />} />
);
