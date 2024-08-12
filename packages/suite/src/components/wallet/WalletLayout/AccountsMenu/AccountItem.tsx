import { forwardRef, Ref } from 'react';
import styled, { useTheme } from 'styled-components';

import { isTestnet } from '@suite-common/wallet-utils';
import { borders, spacingsPx, typography } from '@trezor/theme';
import {
    CoinLogo,
    Icon,
    SkeletonRectangle,
    SkeletonStack,
    TOOLTIP_DELAY_LONG,
    TruncateWithTooltip,
} from '@trezor/components';

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
import { useFormatters } from '@suite-common/formatters';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';

const Wrapper = styled(NavigationItemBase)<{
    $isSelected: boolean;
    $isGroupSelected?: boolean;
    $isGroup?: boolean;
}>`
    background: ${({ theme, $isSelected }) => $isSelected && theme.backgroundSurfaceElevation1};
    gap: 0;
    display: flex;
    justify-content: space-between;
    margin: 0 ${({ $isGroup }) => ($isGroup ? spacingsPx.xxs : '9px')};

    & + & {
        margin-top: ${spacingsPx.xxs};
    }

    &:hover {
        position: relative;
        background: ${({ theme, $isSelected }) =>
            !$isSelected && theme.backgroundTertiaryPressedOnElevation0};
    }
`;

export const Left = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const StyledCoinLogo = styled(CoinLogo)`
    z-index: 20;
`;

const StyledIcon = styled(Icon)`
    z-index: 20;
`;

export const Right = styled.div`
    flex: 1;
    flex-direction: column;
    padding-left: ${spacingsPx.md};
    padding-right: ${spacingsPx.xxs};
    overflow: hidden;
`;
export const FiatAmount = styled.div`
    overflow: hidden;
    text-align: right;
`;

const Row = styled.div`
    display: flex;
    align-items: baseline;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const AccountName = styled.div<{ $isSelected: boolean }>`
    display: flex;
    gap: ${spacingsPx.xxs};
    flex: 1;
    overflow-x: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    ${typography.hint};
    color: ${({ theme, $isSelected }) => ($isSelected ? theme.textDefault : theme.textSubdued)};
    line-height: 1.5;
    font-variant-numeric: tabular-nums;
`;

const Balance = styled.div`
    ${typography.hint};
    color: ${({ theme }) => theme.textSubdued};
    line-height: 1.57;
`;

const FiatValueWrapper = styled.div`
    ${typography.hint};
    color: ${({ theme }) => theme.textSubdued};
    line-height: 1.57;
`;

const TokensCount = styled.div`
    ${typography.label};
    color: ${({ theme }) => theme.textSubdued};
    line-height: 1.57;
`;

const TokensBadge = styled.div`
    ${typography.label};
    color: ${({ theme }) => theme.textSubdued};
    padding: 3px 4px;
    min-width: 24px;
    text-align: center;
    border-radius: ${borders.radii.full};
    background: ${({ theme }) => theme.borderDashed};
    z-index: 20;
`;

const AccountLabelContainer = styled.div`
    flex: 1;
    min-width: 60px;
    overflow: hidden;
    color: ${({ theme }) => theme.textDefault};
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
            tokens,
            dataTestKey,
            onClick,
        }: AccountItemProps,
        ref: Ref<HTMLDivElement>,
    ) => {
        const theme = useTheme();
        const { FiatAmountFormatter } = useFormatters();
        const localCurrency = useSelector(selectLocalCurrency);
        const dispatch = useDispatch();

        const { shouldAnimate } = useLoadingSkeleton();

        const { accountType, index, networkType, symbol } = account;

        const accountRouteParams = {
            symbol,
            accountIndex: index,
            accountType,
        };

        const isTokensCountShown =
            (['cardano', 'solana'].includes(networkType) || account.symbol === 'matic') &&
            !!tokens?.length;

        const getRoute = () => {
            switch (type) {
                case 'coin':
                    return 'wallet-index';
                case 'staking':
                    return 'wallet-staking';
                case 'tokens':
                    return 'wallet-tokens-coins';
            }
        };

        const getLeftComponent = () => {
            switch (type) {
                case 'coin':
                    return (
                        <>
                            <StyledCoinLogo size={24} symbol={symbol} />
                            {isTokensCountShown && type === 'coin' && (
                                <TokensCount>{tokens?.length}</TokensCount>
                            )}
                        </>
                    );
                case 'staking':
                    return <StyledIcon icon="PIGGY_BANK_FILLED" color={theme.iconSubdued} />;
                case 'tokens':
                    return <TokensBadge>{tokens?.length}</TokensBadge>;
            }
        };

        const handleHeaderClick = () => {
            onClick?.();
            dispatch(goto(getRoute(), { params: accountRouteParams }));
        };

        // Show skeleton instead of zero balance during coinjoin initial discovery
        const isBalanceShown = account.backendType !== 'coinjoin' || account.status !== 'initial';

        return (
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
                <Right>
                    <Row>
                        <AccountName $isSelected={isSelected} data-testid={`${dataTestKey}/label`}>
                            <AccountLabelContainer>
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
                            <FiatAmount>
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
                                                <FiatValueWrapper>
                                                    <TruncateWithTooltip
                                                        delayShow={TOOLTIP_DELAY_LONG}
                                                    >
                                                        {value}
                                                    </TruncateWithTooltip>
                                                </FiatValueWrapper>
                                            ) : null
                                        }
                                    </FiatValue>
                                )}
                            </FiatAmount>
                        </AccountName>
                    </Row>
                    {isBalanceShown && type !== 'tokens' && (
                        <>
                            <Row>
                                <Balance>
                                    <CoinBalance value={formattedBalance} symbol={symbol} />
                                </Balance>
                            </Row>
                        </>
                    )}
                    {!isBalanceShown && (
                        <SkeletonStack
                            $col
                            $margin="6px 0px 0px 0px"
                            $childMargin="0px 0px 8px 0px"
                        >
                            <SkeletonRectangle
                                width="100px"
                                height="16px"
                                animate={shouldAnimate}
                            />

                            {!isTestnet(account.symbol) && (
                                <SkeletonRectangle
                                    width="100px"
                                    height="16px"
                                    animate={shouldAnimate}
                                />
                            )}
                        </SkeletonStack>
                    )}
                </Right>
            </Wrapper>
        );
    },
);
