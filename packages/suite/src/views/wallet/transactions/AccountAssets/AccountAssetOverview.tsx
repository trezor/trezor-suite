import { getAccountAssetTableSelectors } from '@suite-common/assets';
import { type AccountKey } from '@suite-common/wallet-types';
import { Column, Row } from '@trezor/components';

import { AssetTableSelectorsProvider } from '#src/views/home/HomeAssetsTable/assetTableSelectorsContext';

import { AccountAssetBalance } from './AccountAssetBalance';
import { AccountAssetEarn } from './AccountAssetEarn';
import { AccountAssetTable } from './AccountAssetTable';

type AccountAssetOverviewProps = {
    accountKey: AccountKey;
};

/** The account as Home shows the wallet: its worth, its stake and each asset it holds. */
export const AccountAssetOverview = ({ accountKey }: AccountAssetOverviewProps) => (
    <AssetTableSelectorsProvider value={getAccountAssetTableSelectors(accountKey)}>
        <Column gap={16} alignItems="stretch" data-testid="@wallet/account-assets">
            <Row gap={16} alignItems="stretch" flexWrap="wrap">
                <AccountAssetBalance />
                <AccountAssetEarn accountKey={accountKey} />
            </Row>
            <AccountAssetTable />
        </Column>
    </AssetTableSelectorsProvider>
);
