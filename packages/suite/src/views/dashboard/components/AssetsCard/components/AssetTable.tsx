import React from 'react';
import styled, { css } from 'styled-components';
import { Network } from '@wallet-types';
import { CoinLogo, Icon, variables, useTheme, motionAnimation } from '@trezor/components';
import {
    FiatValue,
    AmountUnitSwitchWrapper,
    SkeletonCircle,
    SkeletonRectangle,
    Ticker,
    Translation,
} from '@suite-components';
import { CoinBalance } from '@wallet-components';
import { isTestnet } from '@suite-common/wallet-utils';
import * as routerActions from '@suite-actions/routerActions';
import { useActions, useAccountSearch, useLoadingSkeleton } from '@suite-hooks';
import { motion } from 'framer-motion';

const LogoWrapper = styled.div`
    padding-right: 12px;
    display: flex;
    align-items: center;
`;

const Coin = styled.div`
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
`;

const Symbol = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    display: flex;
    align-items: center;
    padding-top: 2px;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-indent: 6px;
`;

const StyledCol = styled(motion.div)<{ $isLastRow?: boolean }>`
    display: flex;
    align-items: center;
    padding: 16px 0;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
    padding-right: 20px;

    ${({ $isLastRow }) =>
        $isLastRow &&
        css`
            border-bottom: none;
        `}
`;

const Col = (props: React.ComponentProps<typeof StyledCol>) => {
    const newProps = { ...props };
    delete newProps.isLastRow;

    return <StyledCol {...motionAnimation.expand} {...newProps} $isLastRow={props.isLastRow} />;
};

const CoinNameWrapper = styled(Col)`
    overflow: hidden;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin-left: 25px;
    text-overflow: ellipsis;
    cursor: pointer;

    ${variables.SCREEN_QUERY.MOBILE} {
        grid-column: 1 / 4;
        margin-left: 20px;
        border-bottom: none;
    }

    :hover {
        ${Coin} {
            text-decoration: underline;
        }
    }
`;

const FailedCol = styled(Col)`
    color: ${({ theme }) => theme.TYPE_RED};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.REGULAR};

    ${variables.SCREEN_QUERY.MOBILE} {
        grid-column: 1 / 3;
        margin-left: 20px;
    }
`;

const CryptoBalanceWrapper = styled(Col)`
    flex: 1;
    white-space: nowrap;

    ${variables.SCREEN_QUERY.MOBILE} {
        grid-column: 1 / 3;
        margin-left: 20px;
    }
`;

const FiatBalanceWrapper = styled.span`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    margin-left: 0.5ch;
`;

const ExchangeRateWrapper = styled(Col)`
    font-variant-numeric: tabular-nums;
    margin-right: 25px;
    padding-right: 0;
`;

interface AssetTableProps {
    network: Network;
    failed: boolean;
    cryptoValue: string;
    isLastRow?: boolean;
}

export const AssetTable = React.memo(
    ({ network, failed, cryptoValue, isLastRow }: AssetTableProps) => {
        const { symbol, name } = network;
        const theme = useTheme();
        const { setCoinFilter, setSearchString } = useAccountSearch();

        const { goto } = useActions({ goto: routerActions.goto });

        return (
            <>
                <CoinNameWrapper
                    isLastRow={isLastRow}
                    onClick={() => {
                        goto('wallet-index', {
                            params: {
                                symbol,
                                accountIndex: 0,
                                accountType: 'normal',
                            },
                        });
                        // activate coin filter and reset account search string
                        setCoinFilter(symbol);
                        setSearchString(undefined);
                    }}
                >
                    <LogoWrapper>
                        <CoinLogo symbol={symbol} size={24} />
                    </LogoWrapper>

                    <Coin>{name}</Coin>

                    <Symbol>{symbol.toUpperCase()}</Symbol>
                </CoinNameWrapper>

                {!failed ? (
                    <CryptoBalanceWrapper isLastRow={isLastRow}>
                        <AmountUnitSwitchWrapper symbol={symbol}>
                            <CoinBalance value={cryptoValue} symbol={symbol} />

                            <FiatBalanceWrapper>
                                <FiatValue
                                    amount={cryptoValue}
                                    symbol={symbol}
                                    showApproximationIndicator
                                />
                            </FiatBalanceWrapper>
                        </AmountUnitSwitchWrapper>
                    </CryptoBalanceWrapper>
                ) : (
                    <FailedCol isLastRow={isLastRow}>
                        <Translation id="TR_DASHBOARD_ASSET_FAILED" />

                        <Icon
                            style={{ paddingLeft: '4px', paddingBottom: '2px' }}
                            icon="WARNING"
                            color={theme.TYPE_RED}
                            size={14}
                        />
                    </FailedCol>
                )}
                <ExchangeRateWrapper isLastRow={isLastRow}>
                    {!isTestnet(symbol) && <Ticker symbol={symbol} />}
                </ExchangeRateWrapper>
            </>
        );
    },
);

export const AssetTableSkeleton = (props: { animate?: boolean }) => {
    const { shouldAnimate } = useLoadingSkeleton();

    const animate = props.animate ?? shouldAnimate;

    return (
        <>
            <CoinNameWrapper isLastRow>
                <LogoWrapper>
                    <SkeletonCircle />
                </LogoWrapper>
                <Coin>
                    <SkeletonRectangle animate={animate} />
                </Coin>
            </CoinNameWrapper>
            <CryptoBalanceWrapper isLastRow>
                <SkeletonRectangle animate={animate} width="160px" />
            </CryptoBalanceWrapper>

            <ExchangeRateWrapper isLastRow>
                <SkeletonRectangle animate={animate} />
            </ExchangeRateWrapper>
        </>
    );
};
