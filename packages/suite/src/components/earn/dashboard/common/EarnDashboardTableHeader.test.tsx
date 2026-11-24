import { type ComponentProps } from 'react';

import { render, screen } from '@testing-library/react';

import { ThemeProvider } from '#src/support/suite/ThemeProvider';

import { EarnDashboardTableHeader } from './EarnDashboardTableHeader';

type TranslationProps = { id: string };

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: TranslationProps) => <span>{id}</span>,
}));

const renderHeader = ({
    accountColumnTranslationId = 'TR_EARN_DASHBOARD_TABLE_ACCOUNT_VAULT',
    showRewardsColumns,
}: Partial<ComponentProps<typeof EarnDashboardTableHeader>> = {}) =>
    render(
        <ThemeProvider>
            <table>
                <EarnDashboardTableHeader
                    accountColumnTranslationId={accountColumnTranslationId}
                    showRewardsColumns={showRewardsColumns}
                />
            </table>
        </ThemeProvider>,
    );

describe('EarnDashboardTableHeader', () => {
    it('should render reward column headers by default', () => {
        renderHeader();

        expect(screen.getByText('TR_EARN_DASHBOARD_TABLE_YEARLY_REWARDS')).toBeInTheDocument();
        expect(screen.getByText('TR_EARN_DASHBOARD_TABLE_POTENTIAL_REWARDS')).toBeInTheDocument();
    });

    it.each([
        'TR_EARN_DASHBOARD_TABLE_ACCOUNT_VAULT',
        'TR_EARN_DASHBOARD_TABLE_ACCOUNT_BALANCE',
    ] as const)(
        'renders the %s and APY headers without reward columns',
        accountColumnTranslationId => {
            renderHeader({ accountColumnTranslationId, showRewardsColumns: false });

            expect(screen.getByText(accountColumnTranslationId)).toBeInTheDocument();
            expect(screen.getByText('TR_EARN_DASHBOARD_TABLE_RATE')).toBeInTheDocument();
            expect(
                screen.queryByText('TR_EARN_DASHBOARD_TABLE_YEARLY_REWARDS'),
            ).not.toBeInTheDocument();
            expect(
                screen.queryByText('TR_EARN_DASHBOARD_TABLE_POTENTIAL_REWARDS'),
            ).not.toBeInTheDocument();
        },
    );
});
