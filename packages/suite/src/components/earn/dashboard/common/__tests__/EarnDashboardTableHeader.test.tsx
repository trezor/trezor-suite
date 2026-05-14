import { type ComponentProps } from 'react';

import { render, screen } from '@testing-library/react';

import { EarnDashboardTableHeader } from '../EarnDashboardTableHeader';

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: { id: string }) => <span>{id}</span>,
}));

const renderHeader = ({
    accountColumnTranslationId = 'TR_EARN_DASHBOARD_TABLE_ACCOUNT_VAULT',
    showRewardsColumns,
}: Partial<ComponentProps<typeof EarnDashboardTableHeader>> = {}) =>
    render(
        <table>
            <EarnDashboardTableHeader
                accountColumnTranslationId={accountColumnTranslationId}
                showRewardsColumns={showRewardsColumns}
            />
        </table>,
    );

describe('EarnDashboardTableHeader', () => {
    it('should render reward column headers by default', () => {
        renderHeader();

        expect(screen.getByText('TR_EARN_DASHBOARD_TABLE_YEARLY_REWARDS')).toBeInTheDocument();
        expect(screen.getByText('TR_EARN_DASHBOARD_TABLE_POTENTIAL_REWARDS')).toBeInTheDocument();
    });

    it('should not render reward column headers when showRewardsColumns is false', () => {
        renderHeader({ showRewardsColumns: false });

        expect(
            screen.queryByText('TR_EARN_DASHBOARD_TABLE_YEARLY_REWARDS'),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByText('TR_EARN_DASHBOARD_TABLE_POTENTIAL_REWARDS'),
        ).not.toBeInTheDocument();
    });

    it('should render configured account and APY column headers', () => {
        renderHeader({ showRewardsColumns: false });

        expect(screen.getByText('TR_EARN_DASHBOARD_TABLE_ACCOUNT_VAULT')).toBeInTheDocument();
        expect(screen.getByText('TR_EARN_DASHBOARD_TABLE_APY')).toBeInTheDocument();
    });

    it('should render account balance column header when configured', () => {
        renderHeader({
            accountColumnTranslationId: 'TR_EARN_DASHBOARD_TABLE_ACCOUNT_BALANCE',
            showRewardsColumns: false,
        });

        expect(screen.getByText('TR_EARN_DASHBOARD_TABLE_ACCOUNT_BALANCE')).toBeInTheDocument();
        expect(screen.getByText('TR_EARN_DASHBOARD_TABLE_APY')).toBeInTheDocument();
    });
});
