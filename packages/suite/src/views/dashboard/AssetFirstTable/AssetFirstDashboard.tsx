import {
    selectAllAccountsToList,
    selectBaseCurrency,
    selectCurrentFiatRates,
} from '@suite-common/wallet-core';
import { Card, Column } from '@trezor/components';

import { DashboardSection } from 'src/components/dashboard';
import { useDiscovery, useSelector } from 'src/hooks/suite';
import { useTotalFiatBalance } from 'src/hooks/wallet/useTotalFiatBalance';

import { AssetFirstTable } from './AssetFirstTable';
import { PortfolioCardHeader } from '../PortfolioCard/PortfolioCardHeader';

/**
 * The whole home tab, asset first: what the wallet is worth, and what it holds.
 *
 * It replaces the dashboard rather than sitting inside it — no graph, no promotions, no onboarding
 * banner — so the page is the balance and the assets and nothing else.
 *
 * Behind the `asset-first-home-table` experimental feature; without it the dashboard is unchanged.
 */
export const AssetFirstDashboard = () => {
    const accounts = useSelector(selectAllAccountsToList);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const currentFiatRates = useSelector(selectCurrentFiatRates);
    const { discovery, isDiscoveryRunning } = useDiscovery();

    const walletBalance = useTotalFiatBalance(accounts, baseCurrencyCode, currentFiatRates);

    return (
        <Column gap={24} data-testid="@dashboard/asset-first">
            <DashboardSection>
                <Card paddingType="none">
                    <PortfolioCardHeader
                        discovery={discovery}
                        fiatAmount={walletBalance}
                        localCurrency={baseCurrencyCode}
                        isDiscoveryRunning={isDiscoveryRunning}
                    />
                </Card>
            </DashboardSection>
            <AssetFirstTable />
        </Column>
    );
};
