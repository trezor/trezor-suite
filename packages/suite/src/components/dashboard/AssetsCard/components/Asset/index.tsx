import React from 'react';
import styled from 'styled-components';
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
import Delta from '../Delta';
import { CoinBalance } from '@wallet-components';
import { useFiatValue } from '@wallet-hooks';

const Cell = styled.div<{ failed?: boolean }>`
    padding: 12px 15px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        padding: 12px 8px;
    }
`;

const FiatValueStyled = styled.div`
    display: block;
    font-family: ${variables.FONT_FAMILY.MONOSPACE};

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        font-family: ${variables.FONT_FAMILY.TTHOVES};
        font-size: ${variables.FONT_SIZE.TINY};
        color: ${colors.BLACK50};
    }
`;

const CoinBalanceWrapper = styled(CoinBalance)`
    font-family: ${variables.FONT_FAMILY.MONOSPACE};
`;

const CryptoValueStyled = styled.div`
    display: block;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK50};
`;

const AssetLabelCell = styled(Cell)`
    grid-area: label;
    display: flex;
    align-items: flex-end;
    line-height: 1;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        padding-bottom: 0;
    }
`;

const LogoCell = styled(Cell)`
    grid-area: logo;
    padding-right: 0;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding-left: 2px;
    }
`;

const CoinLogoStyled = styled(CoinLogo)`
    vertical-align: middle;
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

const FailedCol = styled(Cell)`
    color: ${colors.RED};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.REGULAR}; */
`;

const CryptoValueCell = styled(Cell)`
    grid-area: value;
    text-align: right;
    white-space: nowrap;
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const FiatValueCell = styled(Cell)`
    grid-area: fiat;
    text-align: right;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        text-align: left;
        padding-top: 1px;
        padding-bottom: 0;
        height: 100%;
    }
`;

const GraphCell = styled(Cell)`
    grid-area: chart;
    text-align: center;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        display: none;
    }
`;

const GraphWrapper = styled.div`
    display: inline-block;
    height: 32px;
    width: 100%;
    max-width: 160px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        max-width: 180px;
    }
`;

const ChangeCell = styled(Cell)`
    grid-area: change;
    font-family: ${variables.FONT_FAMILY.MONOSPACE};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.GREENER};

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        display: none;
    }
`;

interface Props {
    network: Network;
    failed: boolean;
    cryptoValue: string;
}

// TODO: there is no point in using grid for < SM/MD/LG screens, where we need to wrap one asset to multiple rows (making basically two cols per item).
// It could be done much easier wth just flexbox.

const Asset = React.memo(({ network, failed, cryptoValue }: Props) => {
    const { symbol, name, testnet } = network;
    const { fiat, localCurrency } = useFiatValue();

    // get graph data only for mainnet and not failed accounts
    const lastWeekData =
        !testnet && !failed ? fiat.find(r => r.symbol === symbol)?.lastWeek?.tickers : [];

    // display one of view:
    // - failed
    // - testnet
    // - mainnet

    return (
        <>
            <LogoCell>
                <CoinLogoStyled symbol={symbol} size={24} />
            </LogoCell>

            <AssetLabelCell>
                <Coin>{name}</Coin>
                <Symbol>{symbol.toUpperCase()}</Symbol>
            </AssetLabelCell>

            {failed ? (
                <FailedCol failed={failed}>
                    <Translation id="TR_DASHBOARD_ASSET_FAILED" />
                    <Icon
                        style={{ paddingLeft: '4px', paddingBottom: '2px' }}
                        icon="WARNING"
                        color={colors.RED}
                        size={14}
                    />
                </FailedCol>
            ) : (
                <>
                    <FiatValueCell>
                        <HiddenPlaceholder>
                            <FiatValue amount={cryptoValue} symbol={symbol}>
                                {({ value }) =>
                                    value ? <FiatValueStyled>{value}</FiatValueStyled> : null
                                }
                            </FiatValue>
                        </HiddenPlaceholder>
                    </FiatValueCell>

                    <GraphCell>
                        <GraphWrapper>
                            <LastWeekGraph
                                lastWeekData={lastWeekData}
                                symbol={symbol}
                                localCurrency={localCurrency}
                            />
                        </GraphWrapper>
                    </GraphCell>

                    <ChangeCell>
                        <Delta value={2.4} />
                    </ChangeCell>

                    <CryptoValueCell>
                        <HiddenPlaceholder>
                            <CoinBalanceWrapper value={cryptoValue} symbol={symbol} />

                            <FiatValue amount={cryptoValue} symbol={symbol}>
                                {({ value }) =>
                                    value ? <CryptoValueStyled>≈ {value}</CryptoValueStyled> : null
                                }
                            </FiatValue>
                        </HiddenPlaceholder>
                    </CryptoValueCell>
                </>
            )}
        </>
    );
});

export default Asset;
