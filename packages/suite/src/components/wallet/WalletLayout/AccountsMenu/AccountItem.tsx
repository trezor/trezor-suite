import { forwardRef, Ref, MouseEventHandler } from 'react';
import styled from 'styled-components';

import { isTestnet } from '@suite-common/wallet-utils';
import { spacingsPx, typography } from '@trezor/theme';
import { CoinLogo, SkeletonRectangle, SkeletonStack } from '@trezor/components';

import { AccountLabel, CoinBalance, FiatValue } from 'src/components/suite';
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
    gap: 0;
    display: flex;
    justify-content: space-between;

    & + & {
        margin-top: ${spacingsPx.xxs};
    }

    :hover {
        position: relative;
        z-index: 2;
        background: ${({ theme, selected }) =>
            !selected && theme.backgroundTertiaryPressedOnElevation0};
    }
`;

export const Left = styled.div`
    padding-top: 3px;
    position: relative;
`;

export const Center = styled.div`
    flex: 1;
    flex-direction: column;
    padding-left: ${spacingsPx.md};
    padding-right: ${spacingsPx.xxs};
    overflow: hidden;
`;
export const Right = styled.div`
    overflow: hidden;
    text-align: right;
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
    ${typography.highlight};
    color: ${({ theme }) => theme.textDefault};
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

interface AccountItemProps {
    account: Account;
    accountLabel?: string;
    selected: boolean;
    closeMenu?: () => void;
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
            closeMenu?.();
            dispatch(goto('wallet-tokens', { params: accountRouteParams }));
        };
        const handleHeaderClick = () => {
            closeMenu?.();
            dispatch(goto('wallet-index', { params: accountRouteParams }));
        };

        // Tokens tab is available for ethereum and cardano accounts only, not yet implemented for XRP
        const isTokensCountShown =
            ['cardano', 'ethereum'].includes(networkType) && !!tokens?.length;

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
                    <CoinLogo size={24} symbol={symbol} />
                    {isTokensCountShown && (
                        <TokensCount count={tokens.length} onClick={handleClickOnTokens} />
                    )}
                </Left>
                <Center>
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
                </Center>
                <Right>
                    <FiatValue amount={formattedBalance} symbol={symbol}>
                        {({ value }) =>
                            value ? <FiatValueWrapper>{value}</FiatValueWrapper> : null
                        }
                    </FiatValue>
                </Right>
            </Wrapper>
        );
    },
);
