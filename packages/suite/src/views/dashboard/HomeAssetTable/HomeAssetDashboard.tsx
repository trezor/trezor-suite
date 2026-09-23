import { useMemo } from 'react';

import { selectDeviceStaticSessionId } from '@suite-common/device';
import { selectAllAccountsToList } from '@suite-common/wallet-core';
import { isAccountFailed } from '@suite-common/wallet-utils';
import { Column } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

import { HomeAssetBalanceCard } from './HomeAssetBalanceCard';
import { HomeAssetFeedback } from './HomeAssetFeedback';
import { HomeAssetTable } from './HomeAssetTable';
import { type AssetAccounts, selectHomeAssetRows } from './homeAssetTableSelectors';
import { DashboardPromoBanner } from '../DashboardPromoBanner/DashboardPromoBanner';
import { HomeAssetNfts } from '../HomeAssetNfts/HomeAssetNfts';
import { EmptyWallet } from '../PortfolioCard/EmptyWallet';
import { PortfolioCardException } from '../PortfolioCard/PortfolioCardException';

const EMPTY_ROWS: readonly AssetAccounts[] = [];

export const HomeAssetDashboard = () => {
    const deviceState = useSelector(selectDeviceStaticSessionId);
    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);
    const accounts = useSelector(selectAllAccountsToList);
    const rows = useSelector(state =>
        deviceState === null ? EMPTY_ROWS : selectHomeAssetRows(state, deviceState),
    );

    const isDeviceEmpty = useMemo(() => accounts.every(account => account.empty), [accounts]);
    const failedAccounts = useMemo(() => accounts.filter(isAccountFailed), [accounts]);

    if (deviceState === null) {
        return null;
    }

    if (rows.length === 0) {
        if (discoveryStatus?.status === 'exception') {
            return <PortfolioCardException exception={discoveryStatus} failed={failedAccounts} />;
        }

        if (isDeviceEmpty && discoveryStatus?.status !== 'loading') {
            return <EmptyWallet />;
        }
    }

    return (
        <Column gap={16} data-testid="@dashboard/home-asset">
            <HomeAssetBalanceCard deviceState={deviceState} />
            <DashboardPromoBanner />
            <HomeAssetTable deviceState={deviceState} />
            <HomeAssetFeedback />
            <HomeAssetNfts deviceState={deviceState} />
        </Column>
    );
};
