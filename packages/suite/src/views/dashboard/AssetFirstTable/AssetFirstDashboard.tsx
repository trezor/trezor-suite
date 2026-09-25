import { useMemo } from 'react';

import { selectDeviceStaticSessionId } from '@suite-common/device';
import { selectAllAccountsToList } from '@suite-common/wallet-core';
import { isAccountFailed } from '@suite-common/wallet-utils';
import { Column } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

import { AssetFirstBalanceCard } from './AssetFirstBalanceCard';
import { AssetFirstTable } from './AssetFirstTable';
import { type AssetRow, selectAssetFirstRows } from './assetFirstTableSelectors';
import { AssetFirstNfts } from '../AssetFirstNfts/AssetFirstNfts';
import { DashboardPromoBanner } from '../DashboardPromoBanner/DashboardPromoBanner';
import { EmptyWallet } from '../PortfolioCard/EmptyWallet';
import { PortfolioCardException } from '../PortfolioCard/PortfolioCardException';

const EMPTY_ROWS: readonly AssetRow[] = [];

export const AssetFirstDashboard = () => {
    const deviceState = useSelector(selectDeviceStaticSessionId);
    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);
    const accounts = useSelector(selectAllAccountsToList);
    const rows = useSelector(state =>
        deviceState === null ? EMPTY_ROWS : selectAssetFirstRows(state, deviceState),
    );

    const isDeviceEmpty = useMemo(() => accounts.every(account => account.empty), [accounts]);
    const failedAccounts = useMemo(() => accounts.filter(isAccountFailed), [accounts]);

    if (deviceState === null) {
        return null;
    }

    // Only when there is nothing to put in the table: what a wallet with nothing on it is told,
    // and what a discovery that went wrong says, are the same here as on the dashboard this
    // replaces — a table of no assets says neither.
    if (rows.length === 0) {
        if (discoveryStatus?.status === 'exception') {
            return <PortfolioCardException exception={discoveryStatus} failed={failedAccounts} />;
        }

        if (isDeviceEmpty && discoveryStatus?.status !== 'loading') {
            return <EmptyWallet />;
        }
    }

    return (
        <Column gap={16} data-testid="@dashboard/asset-first">
            <AssetFirstBalanceCard rows={rows} />
            <DashboardPromoBanner />
            <AssetFirstTable deviceState={deviceState} />
            {/* The NFTs come after the table, and after anything the dashboard puts between. */}
            <AssetFirstNfts deviceState={deviceState} />
        </Column>
    );
};
