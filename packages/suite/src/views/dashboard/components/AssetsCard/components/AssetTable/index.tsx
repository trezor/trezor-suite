import React from 'react';
import styled, { css } from 'styled-components';
import { Network } from '@wallet-types';
import { CoinLogo, Icon, variables, useTheme } from '@trezor/components';
import {
    FiatValue,
    SkeletonCircle,
    SkeletonRectangle,
    Ticker,
    Translation,
} from '@suite-components';
import { CoinBalance } from '@wallet-components';
import { isTestnet } from '@wallet-utils/accountUtils';
import * as routerActions from '@suite-actions/routerActions';
import { useActions, useAccountSearch, useLoadingSkeleton } from '@suite-hooks';
import { ANIMATION } from '@suite-config';
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
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    display: flex;
    align-items: center;
    padding-top: 2px;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-indent: 6px;
`;

const StyledCol = styled(motion.div)<{ isLastRow?: boolean }>`
    display: flex;
    align-items: center;
    padding: 16px 0px;
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    border-bottom: 1px solid ${props => props.theme.STROKE_GREY};
    padding-right: 20px;

    ${props =>
        props.isLastRow &&
        css`
            border-bottom: none;
        `}
`;

const Col = (props: React.ComponentProps<typeof StyledCol>) => (
    <StyledCol {...ANIMATION.EXPAND} {...props} />
);

const CoinNameWrapper = styled(Col)`
    overflow: hidden;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin-left: 25px;
    text-overflow: ellipsis;
    cursor: pointer;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        grid-column: 1 / 4;
        margin-left: 20px;
        border-bottom: none;
    }
`;

const FailedCol = styled(Col)`
    color: ${props => props.theme.TYPE_RED};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.REGULAR};

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        grid-column: 1 / 3;
        margin-left: 20px;
    }
`;

const CryptoBalanceWrapper = styled(Col)`
    flex: 1;
    white-space: nowrap;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        grid-column: 1 / 3;
        margin-left: 20px;
    }
`;

const FiatBalanceWrapper = styled.span`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin-left: 0.5ch;
`;

const ExchangeRateWrapper = styled(Col)`
    font-variant-numeric: tabular-nums;
    margin-right: 25px;
    padding-right: 0px;
`;

interface Props {
    network: Network;
    failed: boolean;
    cryptoValue: string;
    isLastRow?: boolean;
}

const AssetTable = React.memo(({ network, failed, cryptoValue, isLastRow }: Props) => {
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
                    <CoinBalance value={cryptoValue} symbol={symbol} />
                    <FiatBalanceWrapper>
                        <FiatValue
                            amount={cryptoValue}
                            symbol={symbol}
                            showApproximationIndicator
                        />
                    </FiatBalanceWrapper>
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
});

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

export default AssetTable;
