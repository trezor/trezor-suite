import { memo, useState } from 'react';

import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { Box, Column, TOOLTIP_DELAY_NORMAL, Tooltip } from '@trezor/components';

import { useGoToWithAnalytics } from '#src/components/suite/layouts/SuiteLayout/PageHeader/useGoToWithAnalytics';
import { CollapsedSidebarOnly } from '#src/components/suite/layouts/SuiteLayout/Sidebar/CollapsedSidebarOnly';
import { ExpandedSidebarOnly } from '#src/components/suite/layouts/SuiteLayout/Sidebar/ExpandedSidebarOnly';
import { type Account } from '#src/types/wallet';

import { AccountItemContent } from './AccountRow/AccountItemContent/AccountItemContent';
import { AccountRow } from './AccountRow/AccountRow';

type AccountItemProps = {
    account: Account;
    isSelected: boolean;
    customFiatValue?: BaseCurrencyAmount;
    tokenCount: number;
    hasStaking: boolean;
    dataTestKey: string;
    isFiatLoading: boolean;
};

export const AccountItem = memo(
    ({
        account,
        isSelected,
        customFiatValue,
        dataTestKey,
        isFiatLoading,
        tokenCount,
        hasStaking,
    }: AccountItemProps) => {
        const { accountType, index, symbol } = account;
        const [isFocused, setIsFocused] = useState(false);

        const goToWithAnalytics = useGoToWithAnalytics(account);

        const handleHeaderClick = () => {
            goToWithAnalytics({
                routeName: 'wallet-index',
                params: {
                    symbol,
                    accountIndex: index,
                    accountType,
                },
            });
        };

        const commonProps = {
            isFiatLoading,
            dataTestKey,
            tokenCount,
            hasStaking,
            account,
            customFiatValue,
            isFocused,
        };

        return (
            <>
                <ExpandedSidebarOnly>
                    <AccountRow
                        {...commonProps}
                        isSelected={isSelected}
                        handleHeaderClick={handleHeaderClick}
                        onFocusChange={setIsFocused}
                    />
                </ExpandedSidebarOnly>
                <CollapsedSidebarOnly>
                    <Column alignItems="center" width="100%">
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
                                onFocusChange={setIsFocused}
                                isCollapsed
                            />
                        </Tooltip>
                    </Column>
                </CollapsedSidebarOnly>
            </>
        );
    },
);

AccountItem.displayName = 'AccountItem';
