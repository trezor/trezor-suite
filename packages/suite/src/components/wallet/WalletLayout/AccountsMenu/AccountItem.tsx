import { forwardRef, Ref } from 'react';
import styled from 'styled-components';

import { isTestnet } from '@suite-common/wallet-utils';
import { spacingsPx, typography } from '@trezor/theme';
import {
    CoinLogo,
    SkeletonRectangle,
    SkeletonStack,
    TOOLTIP_DELAY_LONG,
    TruncateWithTooltip,
} from '@trezor/components';

import { AccountLabel, CoinBalance, FiatValue } from 'src/components/suite';
import { useDispatch, useLoadingSkeleton } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';
import { goto } from 'src/actions/suite/routerActions';
import { NavigationItemBase } from 'src/components/suite/Preloader/SuiteLayout/Sidebar/NavigationItem';

const Wrapper = styled(NavigationItemBase)<{ isSelected: boolean }>`
    background: ${({ theme, isSelected }) => isSelected && theme.backgroundSurfaceElevation1};
    gap: 0;
    display: flex;
    justify-content: space-between;

    & + & {
        margin-top: ${spacingsPx.xxs};
    }

    :hover {
        position: relative;
        z-index: 2;
        background: ${({ theme, isSelected }) =>
            !isSelected && theme.backgroundTertiaryPressedOnElevation0};
    }
`;

export const Left = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
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

const AccountName = styled.div<{ isSelected: boolean }>`
    display: flex;
    gap: ${spacingsPx.xxs};
    width: 100%;
    overflow-x: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    ${typography.hint};
    color: ${({ theme, isSelected }) => (isSelected ? theme.textDefault : theme.textSubdued)};
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
const AccountLabelContainer = styled.div`
    flex: 1;
    min-width: 60px;
    overflow: hidden;
    color: ${({ theme }) => theme.textDefault};
`;

interface AccountItemProps {
    account: Account;
    accountLabel?: string;
    isSelected: boolean;
    closeMenu?: () => void;
}

// Using `forwardRef` to be able to pass `ref` (item) TO parent (Menu/index)
export const AccountItem = forwardRef(
    (
        { account, accountLabel, isSelected, closeMenu }: AccountItemProps,
        ref: Ref<HTMLDivElement>,
    ) => {
        const dispatch = useDispatch();

        const { shouldAnimate } = useLoadingSkeleton();

        const { accountType, formattedBalance, index, networkType, symbol, tokens } = account;

        const accountRouteParams = {
            symbol,
            accountIndex: index,
            accountType,
        };

        const handleHeaderClick = () => {
            closeMenu?.();
            dispatch(goto('wallet-index', { params: accountRouteParams }));
        };

        // Tokens tab is available for ethereum, cardano and solana accounts only, not yet implemented for XRP
        const isTokensCountShown =
            ['cardano', 'ethereum', 'solana'].includes(networkType) && !!tokens?.length;

        // Show skeleton instead of zero balance during coinjoin initial discovery
        const isBalanceShown = account.backendType !== 'coinjoin' || account.status !== 'initial';

        const dataTestKey = `@account-menu/${symbol}/${accountType}/${index}`;

        return (
            <Wrapper
                isSelected={isSelected}
                ref={ref}
                onClick={handleHeaderClick}
                data-test-id={dataTestKey}
                tabIndex={0}
            >
                <Left>
                    <CoinLogo size={24} symbol={symbol} />
                    {isTokensCountShown && <TokensCount>{tokens.length}</TokensCount>}
                </Left>
                <Right>
                    <Row>
                        <AccountName isSelected={isSelected} data-test-id={`${dataTestKey}/label`}>
                            <AccountLabelContainer>
                                <AccountLabel
                                    accountLabel={accountLabel}
                                    accountType={accountType}
                                    symbol={symbol}
                                    index={index}
                                />
                            </AccountLabelContainer>
                            <FiatAmount>
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
                                                <TruncateWithTooltip delayShow={TOOLTIP_DELAY_LONG}>
                                                    {value}
                                                </TruncateWithTooltip>
                                            </FiatValueWrapper>
                                        ) : null
                                    }
                                </FiatValue>
                            </FiatAmount>
                        </AccountName>
                    </Row>
                    {isBalanceShown && (
                        <>
                            <Row>
                                <Balance>
                                    <CoinBalance value={formattedBalance} symbol={symbol} />
                                </Balance>
                            </Row>
                        </>
                    )}
                    {!isBalanceShown && (
                        <SkeletonStack col margin="6px 0px 0px 0px" childMargin="0px 0px 8px 0px">
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
