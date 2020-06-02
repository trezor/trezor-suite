import React from 'react';
import styled from 'styled-components';
import { Network } from '@wallet-types';
import { CoinLogo, Icon, variables, colors } from '@trezor/components';
import { HiddenPlaceholder, FiatValue, Translation } from '@suite-components';
import LastWeekGraph from '../LastWeekGraph';
import Delta from '../Delta';
import { CARD_PADDING_SIZE } from '@suite/constants/suite/layout';
import { CoinBalance } from '@wallet-components';
import { useFiatValue } from '@wallet-hooks';

const Container = styled.div`
    display: flex;
    align-items: center;

    & + & {
        border-top: 1px solid ${colors.BLACK96};
    }
`;

const Cell = styled.div<{ failed?: boolean }>`
    flex: auto;
    padding: 12px ${CARD_PADDING_SIZE};
`;

// Asset label cell

const AssetLabelCell = styled(Cell)`
    width: 30%;

    display: flex;
    align-items: center;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        width: 50%;
    }
`;

const Coin = styled.div`
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
`;

const CoinLogoStyled = styled(CoinLogo)`
    vertical-align: middle;
    margin-right: 15px;
`;

const AssetLabel = styled.div`
    display: flex;
    align-items: flex-end;
    line-height: 1;
`;

const AssetFiatValueStyled = styled.div`
    display: none;
    font-family: ${variables.FONT_FAMILY.TTHOVES};
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK50};
    padding-top: 1px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        display: block;
    }
`;

const Symbol = styled.div`
    color: ${colors.BLACK50};
    display: flex;
    align-items: center;
    padding-top: 2px;
    font-size: ${variables.FONT_SIZE.TINY};
    text-indent: 6px;
`;

// Amount

const AmountCell = styled(Cell)`
    width: 25%;

    font-size: ${variables.FONT_SIZE.SMALL};

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        width: 50%;
        text-align: right;
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

// Chart cell

const ChartTitle = styled(Cell)`
    width: 15%;

    text-align: center;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        display: none;
    }
`;

const ChartWrapper = styled.div`
    display: inline-block;
    height: 28px;
    width: 100%;
    max-width: 160px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        max-width: 180px;
    }
`;

// Change cell

const ChangeCell = styled(Cell)`
    width: 15%;

    font-family: ${variables.FONT_FAMILY.MONOSPACE};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.GREENER};
    text-align: center;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        display: none;
    }
`;

// Price cell

const PriceCell = styled(Cell)`
    width: 15%;
    text-align: right;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        display: none;
    }
`;

const FiatValueStyled = styled.div`
    font-family: ${variables.FONT_FAMILY.MONOSPACE};
`;

// Failed cell

const FailedCell = styled(Cell)`
    display: flex;
    align-items: center;
    justify-content: flex-end;

    color: ${colors.RED};
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
`;

interface Props {
    network: Network;
    failed: boolean;
    cryptoValue: string;
}

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
        <Container>
            <AssetLabelCell>
                <CoinLogoStyled symbol={symbol} size={24} />

                <div>
                    <AssetLabel>
                        <Coin>{name}</Coin>
                        <Symbol>{symbol.toUpperCase()}</Symbol>
                    </AssetLabel>

                    {!failed && (
                        <HiddenPlaceholder>
                            <FiatValue amount={cryptoValue} symbol={symbol}>
                                {({ value }) =>
                                    value ? (
                                        <AssetFiatValueStyled>{value}</AssetFiatValueStyled>
                                    ) : null
                                }
                            </FiatValue>
                        </HiddenPlaceholder>
                    )}
                </div>
            </AssetLabelCell>

            {failed ? (
                <FailedCell failed={failed}>
                    <Icon
                        style={{ marginRight: '10px', paddingBottom: '2px' }}
                        icon="WARNING"
                        color={colors.RED}
                        size={14}
                    />

                    <Translation id="TR_DASHBOARD_ASSET_FAILED" />
                </FailedCell>
            ) : (
                <>
                    <AmountCell>
                        <HiddenPlaceholder>
                            <CoinBalanceWrapper value={cryptoValue} symbol={symbol} />

                            <FiatValue amount={cryptoValue} symbol={symbol}>
                                {({ value }) =>
                                    value ? <CryptoValueStyled>≈ {value}</CryptoValueStyled> : null
                                }
                            </FiatValue>
                        </HiddenPlaceholder>
                    </AmountCell>

                    <ChartTitle>
                        <ChartWrapper>
                            <LastWeekGraph
                                lastWeekData={lastWeekData}
                                symbol={symbol}
                                localCurrency={localCurrency}
                            />
                        </ChartWrapper>
                    </ChartTitle>

                    <ChangeCell>
                        <Delta value={2.4} />
                    </ChangeCell>

                    <PriceCell>
                        <HiddenPlaceholder>
                            <FiatValue amount={cryptoValue} symbol={symbol}>
                                {({ value }) =>
                                    value ? <FiatValueStyled>{value}</FiatValueStyled> : null
                                }
                            </FiatValue>
                        </HiddenPlaceholder>
                    </PriceCell>
                </>
            )}
        </Container>
    );
});

export default Asset;
