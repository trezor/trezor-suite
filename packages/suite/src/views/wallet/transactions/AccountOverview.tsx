import { ExperimentId, ExperimentWrapper } from '@suite-common/message-system';

import { AccountAssetsPage } from './AccountAssets/AccountAssetsPage';
import { Transactions } from './Transactions';

/** The account's Overview tab, as Home is switched: the page as it was, or the asset-first one. */
export const AccountOverview = () => (
    <ExperimentWrapper
        id={ExperimentId.assetFirstHomeTable}
        components={[
            { variant: 'A', element: <Transactions /> },
            { variant: 'B', element: <AccountAssetsPage /> },
        ]}
    />
);
