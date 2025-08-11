import { Ref, forwardRef, useState } from 'react';

import styled from 'styled-components';

import { EnhancedTokenInfo, selectCoinDefinitions } from '@suite-common/token-definitions';
import { selectBaseCurrency, selectCurrentFiatRates } from '@suite-common/wallet-core';
import { TokenAddress } from '@suite-common/wallet-types';
import { BaseCurrencyAmount } from '@suite-common/wallet-utils';
import { Column, TOOLTIP_DELAY_NORMAL, Tooltip } from '@trezor/components';

import { useGoToWithAnalytics } from 'src/components/suite/layouts/SuiteLayout/PageHeader/useGoToWithAnalytics';
import { NavigationItemBase } from 'src/components/suite/layouts/SuiteLayout/Sidebar/NavigationItem';
import { useSelector } from 'src/hooks/suite';
import { Account, AccountItemType } from 'src/types/wallet';
import { TokensWithRates, enhanceTokensWithRates, getTokens } from 'src/utils/wallet/tokenUtils';

import { AccountItemLeft } from './AccountItemLeft';
import { AccountRow } from './AccountRow';
import { CollapsedSidebarOnly } from '../../../../suite/layouts/SuiteLayout/Sidebar/CollapsedSidebarOnly';
import { ExpandedSidebarOnly } from '../../../../suite/layouts/SuiteLayout/Sidebar/ExpandedSidebarOnly';

export const CollapsedItem = styled(NavigationItemBase)<{ $isSelected: boolean }>`
    background: ${({ theme, $isSelected }) => $isSelected && theme.backgroundSurfaceElevation1};
    line-height: 0;
    z-index: 0;
    position: relative;

    &:hover {
        z-index: 1;
        position: relative;
        background: ${({ theme, $isSelected }) =>
            !$isSelected && theme.backgroundTertiaryPressedOnElevation0};
    }
`;
export const Left = styled.div`
    position: relative;
`;

interface AccountItemProps {
    account: Account;
    tokens: EnhancedTokenInfo[];
    // NOTE: disables the default item click behavior
    forceOnlyItemClick?: boolean;
    isSelected: boolean;
    isGroupSelected?: boolean;
    formattedBalance: string;
    customFiatValue?: BaseCurrencyAmount;
    isGroup?: boolean;
    dataTestKey?: string;
    isFiatLoading?: boolean;
    onClick?: (account: Account, type: AccountItemType, tokenAddress?: TokenAddress) => void;
}

// Using `forwardRef` to be able to pass `ref` (item) TO parent (Menu/index)
export const TokensAccountItem = forwardRef(
    (
        {
            account,
            tokens,
            forceOnlyItemClick,
            isSelected,
            isGroupSelected,
            formattedBalance,
            customFiatValue,
            isGroup,
            dataTestKey,
            isFiatLoading,
            onClick,
        }: AccountItemProps,
        ref: Ref<HTMLDivElement>,
    ) => {
        const { accountType, index, symbol } = account;
        const [isTokensExpanded, setIsTokensExpanded] = useState(false);

        const goToWithAnalytics = useGoToWithAnalytics(account);

        const baseCurrency = useSelector(selectBaseCurrency);
        const fiatRates = useSelector(selectCurrentFiatRates);
        const coinDefinitions = useSelector(state => selectCoinDefinitions(state, symbol));

        const allTokensWithRates = enhanceTokensWithRates(tokens, baseCurrency, symbol, fiatRates);

        if (!allTokensWithRates.length) return null;

        const tokensWithRates = getTokens({
            tokens: allTokensWithRates,
            symbol,
            tokenDefinitions: coinDefinitions,
        })?.shownWithBalance as TokensWithRates[];

        const accountRouteParams = {
            symbol,
            accountIndex: index,
            accountType,
        };

        const handleTokensClick = () => {
            // onClick?.(account, type);
            setIsTokensExpanded(!isTokensExpanded);
        };

        const handleAccountContentClick = (tokenAddress?: TokenAddress) => {
            onClick?.(account, 'tokens', tokenAddress);
        };

        const handleHeaderClick = () => {
            onClick?.(account, 'tokens');

            // NOTE: disable default behavior useful eg in global send modal - when picking account
            // from which to send
            if (forceOnlyItemClick) {
                return;
            }
            goToWithAnalytics('wallet-tokens', { params: accountRouteParams });
        };

        const content = (
            <AccountRow
                isTokensExpanded={isTokensExpanded}
                isFiatLoading={Boolean(isFiatLoading)}
                tokens={tokensWithRates}
                isSelected={isSelected}
                isGroup={isGroup}
                isGroupSelected={isGroupSelected}
                handleHeaderClick={handleHeaderClick}
                dataTestKey={dataTestKey}
                type="tokens"
                account={account}
                ref={ref}
                customFiatValue={customFiatValue}
                formattedBalance={formattedBalance}
                onAccountContentClick={handleAccountContentClick}
                onTokensClick={handleTokensClick}
            />
        );

        return (
            <>
                <ExpandedSidebarOnly>{content}</ExpandedSidebarOnly>
                <CollapsedSidebarOnly>
                    <Column alignItems="start">
                        <Tooltip
                            delayShow={TOOLTIP_DELAY_NORMAL}
                            cursor="pointer"
                            content={content}
                            placement="right"
                            hasArrow
                        >
                            <CollapsedItem
                                $isSelected={isSelected}
                                onClick={() => handleHeaderClick()}
                            >
                                <AccountItemLeft
                                    account={account}
                                    type="tokens"
                                    tokens={tokensWithRates}
                                    onClick={handleTokensClick}
                                />
                            </CollapsedItem>
                        </Tooltip>
                    </Column>
                </CollapsedSidebarOnly>
            </>
        );
    },
);

TokensAccountItem.displayName = 'TokensAccountItem';
