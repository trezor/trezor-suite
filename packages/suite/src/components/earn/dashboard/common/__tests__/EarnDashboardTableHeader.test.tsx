import { render, screen } from '@testing-library/react';

import { EarnDashboardTableHeader } from '../EarnDashboardTableHeader';

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: { id: string }) => <span>{id}</span>,
}));

const renderHeader = (showRewardsColumns?: boolean) =>
    render(
        <table>
            <EarnDashboardTableHeader showRewardsColumns={showRewardsColumns} />
        </table>,
    );

describe('EarnDashboardTableHeader', () => {
    it('should render reward column headers by default', () => {
        renderHeader();

        expect(screen.getByText('TR_EARN_DASHBOARD_TABLE_YEARLY_REWARDS')).toBeInTheDocument();
        expect(screen.getByText('TR_EARN_DASHBOARD_TABLE_POTENTIAL_REWARDS')).toBeInTheDocument();
    });

    it('should not render reward column headers when showRewardsColumns is false', () => {
        renderHeader(false);

        expect(
            screen.queryByText('TR_EARN_DASHBOARD_TABLE_YEARLY_REWARDS'),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByText('TR_EARN_DASHBOARD_TABLE_POTENTIAL_REWARDS'),
        ).not.toBeInTheDocument();
    });

    it('should always render the account and APY column headers', () => {
        renderHeader(false);

        expect(screen.getByText('TR_EARN_DASHBOARD_TABLE_ACCOUNT_VAULT')).toBeInTheDocument();
        expect(screen.getByText('TR_EARN_DASHBOARD_TABLE_APY')).toBeInTheDocument();
    });
});
