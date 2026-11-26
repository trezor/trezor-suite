import { useEffect } from 'react';

import { Translation } from '@suite/intl';
import { ContextMessage } from '@suite/message-system';
import { EarnAnchor, useAnchor } from '@suite/router';
import { Context } from '@suite-common/message-system';
import { Button, Card, Column, Table } from '@trezor/components';
import { OutlineHighlight } from '@trezor/product-components';

import { DashboardSection } from '#src/components/dashboard/DashboardSection';
import { useLayoutSize } from '#src/hooks/suite/useLayoutSize';

import { EarnLidoAccountRow } from './EarnLidoAccountRow';
import { EarnStakingAccountRow } from './EarnStakingAccountRow';
import { EarnStakingActivateRow } from './EarnStakingActivateRow';
import { useLidoEarnAccounts } from './hooks/useLidoEarnAccounts';
import { useStakingTableData } from './hooks/useStakingTableData';
import { EarnProviderInfoBadge } from '../../providers/EarnProviderInfoBadge';
import { EarnDashboardTableHeader } from '../common/EarnDashboardTableHeader';
import { type StakingDashboardReadyPayload } from '../useReportEarnDashboardReadyEvent';

type EarnStakingTableProps = {
    onReady: (payload: StakingDashboardReadyPayload) => void;
};

export const EarnStakingTable = ({ onReady }: EarnStakingTableProps) => {
    const { anchorRef, shouldHighlight } = useAnchor(EarnAnchor.Staking);
    const { isBelowLaptop } = useLayoutSize();
    const isCardLayout = isBelowLaptop;

    const {
        displayedAccounts,
        activateSymbols,
        isExpandable,
        isExpanded,
        toggleExpanded,
        hasAnyRewardsData,
        hasStakingPosition,
        availableStakingCount,
    } = useStakingTableData();
    const lidoAccounts = useLidoEarnAccounts();

    useEffect(() => {
        onReady({ hasStakingPosition, availableStakingCount, hasShowMore: isExpandable });
    }, [onReady, hasStakingPosition, availableStakingCount, isExpandable]);

    return (
        <Column gap={16}>
            <ContextMessage context={Context.getEarnDashboard('staking')} />

            <OutlineHighlight shouldHighlight={shouldHighlight}>
                <DashboardSection
                    heading={<Translation id="TR_EARN_STAKING" />}
                    subheading={<Translation id="TR_EARN_STAKING_DASHBOARD_TEXT" />}
                    actions={
                        <Column margin={isCardLayout ? { top: 8 } : undefined}>
                            <EarnProviderInfoBadge messageId="TR_EARN_STAKING_OPERATED_BY_PROVIDERS" />
                        </Column>
                    }
                    areActionsBelowSubheading={isCardLayout}
                    ref={anchorRef}
                >
                    <Column gap={16} alignItems="center">
                        {isCardLayout ? (
                            <Column gap={8} width="100%">
                                {lidoAccounts.map(account => (
                                    <EarnLidoAccountRow
                                        account={account}
                                        key={account.key}
                                        isCardLayout
                                    />
                                ))}

                                {displayedAccounts.map(account => (
                                    <EarnStakingAccountRow
                                        account={account}
                                        key={account.key}
                                        isCardLayout
                                    />
                                ))}

                                {activateSymbols.map(symbol => (
                                    <EarnStakingActivateRow
                                        symbol={symbol}
                                        key={symbol}
                                        isCardLayout
                                    />
                                ))}
                            </Column>
                        ) : (
                            <Card paddingType="none">
                                <Table isRowHighlightedOnHover margin={{ top: 8 }}>
                                    <EarnDashboardTableHeader
                                        accountColumnTranslationId="TR_EARN_DASHBOARD_TABLE_ACCOUNT_BALANCE"
                                        showRewardsColumns={hasAnyRewardsData}
                                    />
                                    <Table.Body>
                                        {lidoAccounts.map(account => (
                                            <EarnLidoAccountRow
                                                account={account}
                                                key={account.key}
                                                isCardLayout={false}
                                            />
                                        ))}

                                        {displayedAccounts.map(account => (
                                            <EarnStakingAccountRow
                                                account={account}
                                                key={account.key}
                                                isCardLayout={false}
                                            />
                                        ))}

                                        {activateSymbols.map(symbol => (
                                            <EarnStakingActivateRow
                                                symbol={symbol}
                                                key={symbol}
                                                isCardLayout={false}
                                            />
                                        ))}
                                    </Table.Body>
                                </Table>
                            </Card>
                        )}

                        {isExpandable && (
                            <Button intent="neutral" priority="secondary" onClick={toggleExpanded}>
                                <Translation id={isExpanded ? 'TR_SHOW_LESS' : 'TR_SHOW_MORE'} />
                            </Button>
                        )}
                    </Column>
                </DashboardSection>
            </OutlineHighlight>
        </Column>
    );
};
