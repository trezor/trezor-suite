import React from 'react';
import styled from 'styled-components';
import { Network } from '@wallet-types';
import { CoinLogo } from '@trezor/components';
import BigNumber from 'bignumber.js';
import { FormattedNumber, NoRatesTooltip } from '@suite-components';
import { variables } from '@trezor/components-v2';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import Badge from '@suite-components/Badge';
import { LastWeekRates } from '@wallet-reducers/fiatRateReducer';
import { AppState } from '@suite-types';
import { connect } from 'react-redux';

const greenArea = '#D6F3CC';
const greenStroke = '#30c100';
const redArea = '#F6DBDB';
const redStroke = '#d04949';

const Wrapper = styled.div`
    padding: 12px 20px;
    display: grid;
    grid-gap: 10px;
    grid-template-columns: minmax(180px, 2fr) repeat(auto-fit, minmax(80px, 1fr));
`;

const AssetLogoWrapper = styled.div`
    padding-right: 6px;
    display: flex;
    align-items: center;
    padding-bottom: 1px;
`;

const AssetName = styled.div`
    color: #808080;
    font-size: 12px;
`;

// Similar Badge in DeviceItem (part of switch device modal)
// TOOD: refactor to single component
const SmallBadge = styled(Badge)`
    font-size: ${variables.FONT_SIZE.TINY};
`;

const BadgeText = styled.div`
    margin-right: 6px;
`;

const Col = styled.div`
    display: flex;
    align-items: center;
`;

const GraphWrapper = styled(Col)`
    min-height: 25px;
    flex: 1;
    width: 100%;
    height: 25px;
    /* margin-right: 20px; */
`;
const CryptoValueWrapper = styled(Col)`
    flex: 1;
    justify-content: flex-end;
    margin-right: 32px;
    text-align: right;
`;
const FiatValueWrapper = styled(Col)``;

interface OwnProps extends React.HTMLAttributes<HTMLDivElement> {
    name: string;
    symbol: Network['symbol'];
    cryptoValue: BigNumber | string | number;
    fiatValue: BigNumber | string | number;
    exchangeRate: string | number | null;
    localCurrency: string;
}

const mapStateToProps = (state: AppState) => ({
    fiat: state.wallet.fiat,
});

export type Props = ReturnType<typeof mapStateToProps> & OwnProps;

const Asset = React.memo(
    ({ name, symbol, cryptoValue, fiatValue, exchangeRate, localCurrency, ...props }: Props) => {
        const lastWeekData = props.fiat.find(r => r.symbol === symbol)?.lastWeek?.tickers;
        let isGraphGreen = false;

        if (lastWeekData) {
            const firstDataPoint = lastWeekData[0];
            const lastDataPoint = lastWeekData[lastWeekData.length - 1];
            console.log('first', firstDataPoint.rates[localCurrency]);
            console.log('last', lastDataPoint.rates[localCurrency]);
            isGraphGreen = lastDataPoint.rates[localCurrency] > firstDataPoint.rates[localCurrency];
        }

        return (
            <Wrapper {...props}>
                <Col>
                    <AssetLogoWrapper>
                        <CoinLogo symbol={symbol} size={16} />
                    </AssetLogoWrapper>
                    <AssetName>
                        {name} ({symbol.toUpperCase()})
                    </AssetName>
                </Col>
                <Col>
                    <CryptoValueWrapper>
                        {cryptoValue} {symbol.toUpperCase()}{' '}
                    </CryptoValueWrapper>
                </Col>
                <Col>
                    <FiatValueWrapper>
                        <SmallBadge>
                            <FormattedNumber
                                value={fiatValue.toString()}
                                currency={localCurrency}
                            />
                        </SmallBadge>
                    </FiatValueWrapper>
                </Col>
                <Col>
                    <GraphWrapper>
                        <ResponsiveContainer id={symbol} height="100%" width="100%">
                            <AreaChart
                                data={lastWeekData}
                                margin={{
                                    right: 10,
                                    left: 0,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id="greenAreaGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop offset="30%" stopColor={greenArea} stopOpacity={1} />
                                        <stop offset="95%" stopColor="#fff" stopOpacity={1} />
                                    </linearGradient>
                                    <linearGradient
                                        id="redAreaGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop offset="30%" stopColor={redArea} stopOpacity={1} />
                                        <stop offset="95%" stopColor="#fff" stopOpacity={1} />
                                    </linearGradient>
                                </defs>
                                <YAxis hide type="number" domain={['dataMin', 'dataMax']} />
                                <Area
                                    isAnimationActive={false}
                                    type="monotone"
                                    dataKey={data => data.rates.eur}
                                    stroke={isGraphGreen ? greenStroke : redStroke}
                                    fill={
                                        isGraphGreen
                                            ? 'url(#greenAreaGradient)'
                                            : 'url(#redAreaGradient)'
                                    }
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </GraphWrapper>
                </Col>
                <Col>
                    {exchangeRate && (
                        <SmallBadge>
                            1 {symbol.toUpperCase()} ={' '}
                            <FormattedNumber
                                value={exchangeRate.toString()}
                                currency={localCurrency}
                            />
                        </SmallBadge>
                    )}
                    {!exchangeRate && (
                        <>
                            <SmallBadge>
                                <BadgeText>N/A</BadgeText> <NoRatesTooltip />
                            </SmallBadge>
                        </>
                    )}
                </Col>
            </Wrapper>
        );
    },
);

export default connect(mapStateToProps, null)(Asset);
