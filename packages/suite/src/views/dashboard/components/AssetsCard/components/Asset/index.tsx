import React from 'react';
import styled, { css } from 'styled-components';
import { Network } from '@wallet-types';
import { CoinLogo, Icon, variables, colors } from '@trezor/components';
import { FiatValue, Ticker, Translation } from '@suite-components';
import { CoinBalance } from '@wallet-components';
import { isTestnet } from '@wallet-utils/accountUtils';
import * as routerActions from '@suite-actions/routerActions';
import { useActions, useAccountSearch } from '@suite-hooks';

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
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    display: flex;
    align-items: center;
    padding-top: 2px;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-indent: 6px;
`;

const Col = styled.div<{ isLastRow?: boolean }>`
    display: flex;
    align-items: center;
    padding: 16px 0px;
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
    padding-right: 20px;

    ${props =>
        props.isLastRow &&
        css`
            border-bottom: none;
        `}
`;

const CoinNameWrapper = styled(Col)`
    overflow: hidden;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin-left: 25px;
    text-overflow: ellipsis;
    cursor: pointer;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        grid-column: 1 / 4;
        border-bottom: none;
    }
`;

const FailedCol = styled(Col)`
    color: ${colors.RED};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.REGULAR};

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        grid-column: 1 / 3;
        margin-left: 25px;
        border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
    }
`;

const CryptoBalanceWrapper = styled(Col)`
    flex: 1;
    white-space: nowrap;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        grid-column: 1 / 3;
        margin-left: 25px;
        border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
    }
`;

const FiatBalanceWrapper = styled.span`
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
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

const Asset = React.memo(({ network, failed, cryptoValue, isLastRow }: Props) => {
    const { symbol, name } = network;
    const { setCoinFilter, setSearchString } = useAccountSearch();

    const { goto } = useActions({ goto: routerActions.goto });
    return (
        <>
            <CoinNameWrapper
                isLastRow={isLastRow}
                onClick={() => {
                    goto('wallet-index', {
                        symbol,
                        accountIndex: 0,
                        accountType: 'normal',
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
                        color={colors.RED}
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

export default Asset;
