import { forwardRef, Ref } from 'react';

import styled from 'styled-components';

import { isTestnet } from '@suite-common/wallet-utils';
import { spacings, spacingsPx, typography } from '@trezor/theme';
import {
    Icon,
    Column,
    Row,
    SkeletonRectangle,
    Tooltip,
    TOOLTIP_DELAY_LONG,
    TOOLTIP_DELAY_NORMAL,
    TruncateWithTooltip,
} from '@trezor/components';
import { useFormatters } from '@suite-common/formatters';
import { CoinLogo } from '@trezor/product-components';

import {
    AccountLabel,
    CoinBalance,
    FiatValue,
    HiddenPlaceholder,
    Translation,
} from 'src/components/suite';
import { useDispatch, useLoadingSkeleton, useSelector } from 'src/hooks/suite';
import { Account, AccountItemType } from 'src/types/wallet';
import { goto } from 'src/actions/suite/routerActions';
import { NavigationItemBase } from 'src/components/suite/layouts/SuiteLayout/Sidebar/NavigationItem';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { TokenIconSetWrapper } from 'src/components/wallet/TokenIconSetWrapper';

import { ExpandedSidebarOnly } from '../../../suite/layouts/SuiteLayout/Sidebar/ExpandedSidebarOnly';
import { CollapsedSidebarOnly } from '../../../suite/layouts/SuiteLayout/Sidebar/CollapsedSidebarOnly';

const ICON_SIZE = 24;

const Wrapper = styled(NavigationItemBase)<{
    $isSelected: boolean;
    $isGroupSelected?: boolean;
    $isGroup?: boolean;
}>`
    background: ${({ theme, $isSelected }) => $isSelected && theme.backgroundSurfaceElevation1};
    gap: ${spacingsPx.md};
    display: flex;
    justify-content: space-between;
    color: ${({ theme }) => theme.textSubdued};
    ${typography.hint};

    &:hover {
        background: ${({ theme, $isSelected }) =>
            !$isSelected && theme.backgroundTertiaryPressedOnElevation0};
    }
`;

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

const AccountLabelContainer = styled.div`
    flex: 1;
    min-width: 60px;
    color: ${({ theme }) => theme.textDefault};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

interface AccountItemProps {
    account: Account;
    type: AccountItemType;
    accountLabel?: string;
    isSelected: boolean;
    isGroupSelected?: boolean;
    formattedBalance: string;
    customFiatValue?: string;
    isGroup?: boolean;
    tokens?: Account['tokens'];
    dataTestKey?: string;
    onClick?: () => void;
}

// Using `forwardRef` to be able to pass `ref` (item) TO parent (Menu/index)
export const AccountItem = forwardRef(
    (
        {
            account,
            type,
            accountLabel,
            isSelected,
            isGroupSelected,
            formattedBalance,
            customFiatValue,
            isGroup,
            dataTestKey,
            onClick,
        }: AccountItemProps,
        ref: Ref<HTMLDivElement>,
    ) => {
        const { FiatAmountFormatter } = useFormatters();
        const localCurrency = useSelector(selectLocalCurrency);
        const dispatch = useDispatch();

        const { shouldAnimate } = useLoadingSkeleton();

        const { accountType, index, symbol } = account;

        const accountRouteParams = {
            symbol,
            accountIndex: index,
            accountType,
        };

        const getRoute = () => {
            switch (type) {
                case 'coin':
                    return 'wallet-index';
                case 'staking':
                    return 'wallet-staking';
                case 'tokens':
                    return 'wallet-tokens';
            }
        };

        const getLeftComponent = () => {
            switch (type) {
                case 'coin':
                    return (
                        <Column alignItems="center">
                            <CoinLogo size={ICON_SIZE} symbol={symbol} />
                        </Column>
                    );
                case 'staking':
                    return <Icon name="piggyBankFilled" variant="tertiary" />;
                case 'tokens':
                    return <TokenIconSetWrapper accounts={[account]} symbol={account.symbol} />;
            }
        };

        const handleHeaderClick = () => {
            onClick?.();
            dispatch(goto(getRoute(), { params: accountRouteParams }));
        };

        // Show skeleton instead of zero balance during coinjoin initial discovery
        const isBalanceShown = account.backendType !== 'coinjoin' || account.status !== 'initial';

        const ItemContent = () => (
            <Column flex="1" overflow="hidden" gap={spacings.xxxs}>
                <Row
                    gap={spacings.md}
                    margin={{ right: spacings.xxs }}
                    justifyContent="space-between"
                >
                    <AccountLabelContainer data-testid={`${dataTestKey}/label`}>
                        {type === 'coin' && (
                            <AccountLabel
                                accountLabel={accountLabel}
                                accountType={accountType}
                                symbol={symbol}
                                index={index}
                            />
                        )}
                        {type === 'staking' && <Translation id="TR_NAV_STAKING" />}
                        {type === 'tokens' && <Translation id="TR_NAV_TOKENS" />}
                    </AccountLabelContainer>
                    {customFiatValue && !isTestnet(symbol) ? (
                        <HiddenPlaceholder>
                            <FiatAmountFormatter
                                value={customFiatValue}
                                currency={localCurrency}
                                minimumFractionDigits={0}
                                maximumFractionDigits={0}
                            />
                        </HiddenPlaceholder>
                    ) : (
                        <FiatValue
                            amount={formattedBalance}
                            symbol={symbol}
                            fiatAmountFormatterOptions={{
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                            }}
                        >
                            {({ value }) =>
                                value ? (
                                    <TruncateWithTooltip delayShow={TOOLTIP_DELAY_LONG}>
                                        {value}
                                    </TruncateWithTooltip>
                                ) : null
                            }
                        </FiatValue>
                    )}
                </Row>
                {isBalanceShown && type !== 'tokens' && (
                    <CoinBalance value={formattedBalance} symbol={symbol} />
                )}
                {!isBalanceShown && (
                    <Column gap={spacings.xs}>
                        <SkeletonRectangle width="100px" height="16px" animate={shouldAnimate} />

                        {!isTestnet(account.symbol) && (
                            <SkeletonRectangle
                                width="100px"
                                height="16px"
                                animate={shouldAnimate}
                            />
                        )}
                    </Column>
                )}
            </Column>
        );

        const AccountRow = () => (
            <Wrapper
                $isSelected={isSelected}
                $isGroup={isGroup}
                $isGroupSelected={isGroupSelected}
                ref={ref}
                onClick={handleHeaderClick}
                data-testid={dataTestKey}
                tabIndex={0}
            >
                <Left>{getLeftComponent()}</Left>
                <ItemContent />
            </Wrapper>
        );

        return (
            <>
                <ExpandedSidebarOnly>
                    <AccountRow />
                </ExpandedSidebarOnly>
                <CollapsedSidebarOnly>
                    <Column alignItems="center">
                        <Tooltip
                            delayShow={TOOLTIP_DELAY_NORMAL}
                            cursor="pointer"
                            content={<ItemContent />}
                            placement="right"
                            hasArrow
                        >
                            <CollapsedItem $isSelected={isSelected} onClick={handleHeaderClick}>
                                {getLeftComponent()}
                            </CollapsedItem>
                        </Tooltip>
                    </Column>
                </CollapsedSidebarOnly>
            </>
        );
    },
);
