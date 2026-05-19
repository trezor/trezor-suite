import { Translation, type TranslationKey } from '@suite/intl';
import { Table } from '@trezor/components';

type EarnDashboardTableHeaderProps = {
    accountColumnTranslationId: TranslationKey;
    showRewardsColumns?: boolean;
    hidden?: boolean;
};

export const EarnDashboardTableHeader = ({
    accountColumnTranslationId,
    showRewardsColumns = true,
    hidden = false,
}: EarnDashboardTableHeaderProps) => {
    if (hidden) return null;

    return (
        <Table.Header>
            <Table.Row>
                <Table.Cell>
                    <Translation id={accountColumnTranslationId} />
                </Table.Cell>
                <Table.Cell>
                    <Translation id="TR_EARN_DASHBOARD_TABLE_APY" />
                </Table.Cell>
                <Table.Cell>
                    {showRewardsColumns && (
                        <Translation id="TR_EARN_DASHBOARD_TABLE_YEARLY_REWARDS" />
                    )}
                </Table.Cell>
                <Table.Cell>
                    {showRewardsColumns && (
                        <Translation id="TR_EARN_DASHBOARD_TABLE_POTENTIAL_REWARDS" />
                    )}
                </Table.Cell>
                {/* Actions column */}
                <Table.Cell />
            </Table.Row>
        </Table.Header>
    );
};
