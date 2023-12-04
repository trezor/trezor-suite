import { forwardRef, Ref, MouseEventHandler } from 'react';
import styled from 'styled-components';

import { isTestnet } from '@suite-common/wallet-utils';
import { spacingsPx } from '@trezor/theme';
import { CoinLogo, variables } from '@trezor/components';

import {
    AccountLabel,
    CoinBalance,
    FiatValue,
    SkeletonStack,
    SkeletonRectangle,
} from 'src/components/suite';
import { useDispatch, useLoadingSkeleton } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';
import { goto } from 'src/actions/suite/routerActions';
import { TokensCount } from './TokensCount';
import { NavigationItemBase } from 'src/components/suite/Preloader/SuiteLayout/Sidebar/NavigationItem';

interface WrapperProps {
    selected: boolean;
    type: string;
}

const Wrapper = styled(NavigationItemBase)<WrapperProps>`
    background: ${({ theme, selected }) => selected && theme.backgroundSurfaceElevation1};

    & + & {
        margin-top: ${spacingsPx.xxs};
    }

    :hover {
        background: ${({ theme, selected }) =>
            !selected && theme.backgroundTertiaryPressedOnElevation0};
    }
`;

export const Left = styled.div`
    display: flex;
    padding-top: 3px;
`;

export const Right = styled.div`
    display: flex;
    flex-direction: column;
    padding-left: 8px;
    overflow: hidden;
    padding-right: 10px;
    margin-right: -10px;
`;

const Row = styled.div`
    display: flex;
    align-items: baseline;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const AccountName = styled.div`
    display: flex;
    overflow-x: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    line-height: 1.5;
    font-variant-numeric: tabular-nums;
`;

const Balance = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    line-height: 1.57;
`;

const FiatValueWrapper = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    line-height: 1.57;
`;

interface AccountItemProps {
    account: Account;
    accountLabel?: string;
    selected: boolean;
    closeMenu: () => void;
}

// Using `forwardRef` to be able to pass `ref` (item) TO parent (Menu/index)
export const AccountItem = forwardRef(
    (
        { account, accountLabel, selected, closeMenu }: AccountItemProps,
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

        const handleClickOnTokens: MouseEventHandler = event => {
            event.stopPropagation();
            closeMenu();
            dispatch(goto('wallet-tokens', { params: accountRouteParams }));
        };
        const handleHeaderClick = () => {
            closeMenu();
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
                selected={selected}
                type={accountType}
                ref={ref}
                onClick={handleHeaderClick}
                data-test={dataTestKey}
                tabIndex={0}
            >
                <Left>
                    <CoinLogo size={16} symbol={symbol} />
                </Left>
                <Right>
                    <Row>
                        <AccountName data-test={`${dataTestKey}/label`}>
                            <AccountLabel
                                accountLabel={accountLabel}
                                accountType={accountType}
                                symbol={symbol}
                                index={index}
                            />
                        </AccountName>
                    </Row>
                    {isBalanceShown && (
                        <>
                            <Row>
                                <Balance>
                                    <CoinBalance value={formattedBalance} symbol={symbol} />
                                </Balance>
                                {isTokensCountShown && (
                                    <TokensCount
                                        count={tokens.length}
                                        onClick={handleClickOnTokens}
                                    />
                                )}
                            </Row>
                            <Row>
                                <FiatValue
                                    amount={formattedBalance}
                                    symbol={symbol}
                                    showApproximationIndicator
                                >
                                    {({ value }) =>
                                        value ? <FiatValueWrapper>{value}</FiatValueWrapper> : null
                                    }
                                </FiatValue>
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
