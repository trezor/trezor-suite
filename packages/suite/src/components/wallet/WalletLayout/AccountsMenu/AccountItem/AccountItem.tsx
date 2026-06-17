import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { Box, TOOLTIP_DELAY_NORMAL, Tooltip } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';

import { useGoToWithAnalytics } from 'src/components/suite/layouts/SuiteLayout/PageHeader/useGoToWithAnalytics';
import { CollapsedSidebarOnly } from 'src/components/suite/layouts/SuiteLayout/Sidebar/CollapsedSidebarOnly';
import { ExpandedSidebarOnly } from 'src/components/suite/layouts/SuiteLayout/Sidebar/ExpandedSidebarOnly';
import { type Account, type AccountItemType } from 'src/types/wallet';

import { AccountItemContent } from './AccountRow/AccountItemContent/AccountItemContent';
import { AccountRow } from './AccountRow/AccountRow';

function getRoute(type: AccountItemType) {
    switch (type) {
        case 'coin':
            return 'wallet-index';
        case 'staking':
            return 'wallet-staking';
        case 'tokens':
            return 'wallet-tokens';
        default:
            return exhaustive(type);
    }
}

export interface AccountItemProps {
    account: Account;
    // NOTE: disables the default item click behavior
    forceOnlyItemClick?: boolean;
    type: AccountItemType;
    isSelected: boolean;
    formattedBalance: string;
    customFiatValue?: BaseCurrencyAmount;
    tokens?: Account['tokens'];
    dataTestKey?: string;
    isFiatLoading?: boolean;
    onClick?: (account: Account, type: AccountItemType) => void;
}

export const AccountItem = ({
    account,
    forceOnlyItemClick,
    type,
    isSelected,
    formattedBalance,
    customFiatValue,
    dataTestKey,
    isFiatLoading,
    onClick,
}: AccountItemProps) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { accountType, index, symbol } = account;

    const goToWithAnalytics = useGoToWithAnalytics(account);

    const handleHeaderClick = () => {
        onClick?.(account, type);

        // NOTE: disable default behavior useful eg in global send modal - when picking account
        // from which to send
        if (forceOnlyItemClick) {
            return;
        }

        goToWithAnalytics({
            routeName: getRoute(type),
            params: {
                symbol,
                accountIndex: index,
                accountType,
            },
        });

        if (type === 'staking') {
            analytics.report({
                type: events.stakingNavigateEvent.name,
                payload: {
                    action: 'navigate',
                    from: 'sidebar',
                    networkSymbol: symbol,
                },
            });
        }
    };

    const commonProps = {
        isFiatLoading: Boolean(isFiatLoading),
        formattedBalance,
        dataTestKey,
        type,
        account,
        customFiatValue,
    };

    return (
        <>
            <ExpandedSidebarOnly>
                <AccountRow
                    {...commonProps}
                    isSelected={isSelected}
                    handleHeaderClick={handleHeaderClick}
                />
            </ExpandedSidebarOnly>
            <CollapsedSidebarOnly>
                <Tooltip
                    delayShow={TOOLTIP_DELAY_NORMAL}
                    cursor="pointer"
                    content={
                        <Box padding={4}>
                            <AccountItemContent {...commonProps} />
                        </Box>
                    }
                    placement="right"
                >
                    <AccountRow
                        {...commonProps}
                        isSelected={isSelected}
                        handleHeaderClick={handleHeaderClick}
                        isCollapsed
                    />
                </Tooltip>
            </CollapsedSidebarOnly>
        </>
    );
};
