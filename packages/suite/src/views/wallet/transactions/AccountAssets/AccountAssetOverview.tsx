import { type AccountKey } from '@suite-common/wallet-types';
import { Column, Row } from '@trezor/components';

import { AccountAssetBalance } from './AccountAssetBalance';
import { AccountAssetEarn } from './AccountAssetEarn';
import { AccountAssetTable } from './AccountAssetTable';

type AccountAssetOverviewProps = {
    accountKey: AccountKey;
};

/** The account as Home shows the wallet: its worth, its stake and each asset it holds. */
export const AccountAssetOverview = ({ accountKey }: AccountAssetOverviewProps) => (
    <Column gap={16} alignItems="stretch" data-testid="@wallet/account-assets">
        <Row gap={16} alignItems="stretch" flexWrap="wrap">
            <AccountAssetBalance accountKey={accountKey} />
            <AccountAssetEarn accountKey={accountKey} />
        </Row>
        {/* Keyed so that another account opens with an empty search and a folded table. */}
        <AccountAssetTable key={accountKey} accountKey={accountKey} />
    </Column>
);
