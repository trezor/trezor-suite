import { Translation } from '@suite/intl';
import { EarnAnchor, useAnchor } from '@suite/router';
import { Context } from '@suite-common/message-system';
import { Button, Card, Column, Table } from '@trezor/components';
import { OutlineHighlight } from '@trezor/product-components';

import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';

import { EarnStakingAccountRow } from './EarnStakingAccountRow';
import { EarnStakingActivateRow } from './EarnStakingActivateRow';
import { EarnDashboardSection } from '../common/EarnDashboardSection';
import { EarnDashboardTableHeader } from '../common/EarnDashboardTableHeader';
import { useStakingTableData } from './hooks/useStakingTableData';

export const EarnStakingTable = () => {
    const { anchorRef, shouldHighlight } = useAnchor(EarnAnchor.Staking);
    const { isBelowLaptop } = useLayoutSize();
    const isCardLayout = isBelowLaptop;

    const {
        displayedAccounts,
        ethNotActivated,
        adaNotActivated,
        solNotActivated,
        isExpandable,
        isExpanded,
        toggleExpanded,
        hasAnyRewardsData,
    } = useStakingTableData();

    return (
        <Column gap={16}>
            <ContextMessage context={Context.getEarnDashboard('staking')} />

            <OutlineHighlight shouldHighlight={shouldHighlight}>
                <EarnDashboardSection
                    titleId="TR_EARN_STAKING_DASHBOARD_TITLE"
                    subheadingId="TR_EARN_STAKING_DASHBOARD_TEXT"
                    provider="everstake"
                    sectionRef={anchorRef}
                >
                    <Column gap={16} alignItems="center">
                        {isCardLayout ? (
                            <Column gap={8} width="100%">
                                {displayedAccounts.map(account => (
                                    <EarnStakingAccountRow
                                        account={account}
                                        key={account.key}
                                        isCardLayout
                                    />
                                ))}

                                {ethNotActivated && (
                                    <EarnStakingActivateRow symbol="eth" isCardLayout />
                                )}
                                {adaNotActivated && (
                                    <EarnStakingActivateRow symbol="ada" isCardLayout />
                                )}
                                {solNotActivated && (
                                    <EarnStakingActivateRow symbol="sol" isCardLayout />
                                )}
                            </Column>
                        ) : (
                            <Card paddingType="none">
                                <Table isRowHighlightedOnHover margin={{ top: 8 }}>
                                    <EarnDashboardTableHeader
                                        accountColumnTranslationId="TR_EARN_DASHBOARD_TABLE_ACCOUNT_BALANCE"
                                        showRewardsColumns={hasAnyRewardsData}
                                    />
                                    <Table.Body>
                                        {displayedAccounts.map(account => (
                                            <EarnStakingAccountRow
                                                account={account}
                                                key={account.key}
                                                isCardLayout={false}
                                            />
                                        ))}

                                        {ethNotActivated && (
                                            <EarnStakingActivateRow
                                                symbol="eth"
                                                isCardLayout={false}
                                            />
                                        )}
                                        {adaNotActivated && (
                                            <EarnStakingActivateRow
                                                symbol="ada"
                                                isCardLayout={false}
                                            />
                                        )}
                                        {solNotActivated && (
                                            <EarnStakingActivateRow
                                                symbol="sol"
                                                isCardLayout={false}
                                            />
                                        )}
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
                </EarnDashboardSection>
            </OutlineHighlight>
        </Column>
    );
};
