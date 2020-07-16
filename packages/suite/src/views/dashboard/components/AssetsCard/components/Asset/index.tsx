import React from 'react';
import styled, { css } from 'styled-components';
import { Network } from '@wallet-types';
import { CoinLogo, Icon, variables, colors } from '@trezor/components';
import {
    NoRatesTooltip,
    HiddenPlaceholder,
    Badge,
    FiatValue,
    Translation,
} from '@suite-components';
import LastWeekGraph from '../LastWeekGraph';
import { CoinBalance } from '@wallet-components';
import { useFiatValue } from '@wallet-hooks';

const LogoWrapper = styled.div`
    padding-right: 6px;
    display: flex;
    align-items: center;
`;

const Coin = styled.div`
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
`;

const Symbol = styled.div`
    color: ${colors.BLACK50};
    display: flex;
    align-items: center;
    padding-top: 2px;
    font-size: ${variables.FONT_SIZE.TINY};
    text-indent: 6px;
`;

const Col = styled.div<{ failed?: boolean; isFirstRow?: boolean }>`
    display: flex;
    align-items: center;
    padding: 12px 4px;
    border-top: 2px solid ${colors.BLACK96};

    ${props =>
        props.failed &&
        props.isFirstRow &&
        css`
            &:nth-child(-n + 2) {
                /* first row with failed account has only 2 cols */
                border-top: none;
            }
        `}
    ${props =>
        !props.failed &&
        props.isFirstRow &&
        css`
            &:nth-child(-n + 5) {
                /* first row has 5 cols */
                border-top: none;
            }
        `}
`;

const CoinNameWrapper = styled(Col)`
    overflow: hidden;
    text-overflow: ellipsis;
    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        grid-column: 1 / 2;
    }
    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        grid-column: 1 / 4;
    }
`;

const FailedCol = styled(Col)`
    grid-column: 2 / 6;
    justify-content: flex-end;
    color: ${colors.RED};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.REGULAR};

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        border-top: none;
    }
`;

const CryptoValueWrapper = styled(Col)`
    flex: 1;
    justify-content: flex-end;
    padding-right: 32px;
    text-align: right;
    white-space: nowrap;
    font-size: ${variables.FONT_SIZE.SMALL};
    /* overflow: hidden; */

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        grid-column: 2 / 2;
    }
    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        grid-column: 1 / 1;
        border-top: none;
    }
`;

const FiatValueWrapper = styled(Col)`
    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        grid-column: 3 / 3;
        justify-content: flex-end;
    }
    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        grid-column: 2 / 4;
        justify-content: flex-end;
        text-align: right;
        border-top: none;
    }
`;

const GraphWrapper = styled(Col)`
    flex: 1;
    width: 100%;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        max-width: 180px;
    }
    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        grid-column: 1 / 1;
        border-top: none;
    }
`;

const FiatRateWrapper = styled(Col)`
    justify-content: flex-end;
    font-variant-numeric: tabular-nums;
    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        grid-column: 3 / 3;
        border-top: none;
    }
`;

interface Props {
    network: Network;
    failed: boolean;
    cryptoValue: string;
    isFirstRow?: boolean;
}

// TODO: there is no point in using grid for < SM/MD/LG screens, where we need to wrap one asset to multiple rows (making basically two cols per item).
// It could be done much easier wth just flexbox.

const Asset = React.memo(({ network, failed, cryptoValue, isFirstRow }: Props) => {
    const { symbol, name, testnet } = network;
    const { fiat, localCurrency } = useFiatValue();

    // get graph data only for mainnet and not failed accounts
    const lastWeekData =
        !testnet && !failed ? fiat.coins.find(r => r.symbol === symbol)?.lastWeek?.tickers : [];

    // display one of view:
    // - failed
    // - testnet
    // - mainnet

    return (
        <>
            <CoinNameWrapper isFirstRow={isFirstRow} failed={failed}>
                <LogoWrapper>
                    <CoinLogo symbol={symbol} size={16} />
                </LogoWrapper>
                <Coin>{name}</Coin>
                <Symbol>{symbol.toUpperCase()}</Symbol>
            </CoinNameWrapper>
            {failed && (
                <FailedCol failed={failed} isFirstRow={isFirstRow}>
                    <Translation id="TR_DASHBOARD_ASSET_FAILED" />
                    <Icon
                        style={{ paddingLeft: '4px', paddingBottom: '2px' }}
                        icon="WARNING"
                        color={colors.RED}
                        size={14}
                    />
                </FailedCol>
            )}
            {!failed && (
                <>
                    <CryptoValueWrapper isFirstRow={isFirstRow}>
                        <CoinBalance value={cryptoValue} symbol={symbol} />
                    </CryptoValueWrapper>
                    <FiatValueWrapper isFirstRow={isFirstRow}>
                        <HiddenPlaceholder>
                            <FiatValue
                                amount={cryptoValue}
                                symbol={symbol}
                                badge={{ color: 'blue', size: 'small' }}
                            />
                        </HiddenPlaceholder>
                    </FiatValueWrapper>
                    <GraphWrapper isFirstRow={isFirstRow}>
                        <LastWeekGraph
                            lastWeekData={lastWeekData}
                            symbol={symbol}
                            localCurrency={localCurrency}
                        />
                    </GraphWrapper>
                    <FiatRateWrapper isFirstRow={isFirstRow}>
                        <FiatValue amount={cryptoValue} symbol={symbol}>
                            {({ rate }) =>
                                rate ? (
                                    <Badge isSmall isGray>
                                        {`1 ${symbol.toUpperCase()} =`}
                                        &nbsp;
                                        {rate}
                                    </Badge>
                                ) : (
                                    <NoRatesTooltip />
                                )
                            }
                        </FiatValue>
                    </FiatRateWrapper>
                </>
            )}
        </>
    );
});

export default Asset;
