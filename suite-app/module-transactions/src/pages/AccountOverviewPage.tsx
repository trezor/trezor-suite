import { AssetFirstHomeExperiment } from '@trezor/suite';

import { SelectedAccountAssetOverview } from './SelectedAccountAssetOverview';
import { TransactionsPage } from './TransactionsPage';

/**
 * The account's Overview tab, as Home is switched: the page as it was, or the same page with the
 * account's assets, as Home lists the wallet's, at its top.
 */
export const AccountOverviewPage = () => (
    <AssetFirstHomeExperiment
        original={<TransactionsPage />}
        assetFirst={<TransactionsPage topSection={<SelectedAccountAssetOverview />} />}
    />
);
