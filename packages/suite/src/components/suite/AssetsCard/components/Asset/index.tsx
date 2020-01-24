import React from 'react';
import styled from 'styled-components';
import { Network } from '@wallet-types';
import { CoinLogo } from '@trezor/components';
import BigNumber from 'bignumber.js';
import { FormattedNumber, NoRatesTooltip } from '@suite-components';
import { variables } from '@trezor/components-v2';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import Badge from '@suite-components/Badge';

const greenArea = '#D6F3CC';
const greenStroke = '#30c100';
const redArea = '#F6DBDB';
const redStroke = '#d04949';

const data = [
    {
        name: 'Page A',
        uv: 4000,
        pv: 2400,
        amt: 2400,
    },
    {
        name: 'Page B',
        uv: 3000,
        pv: 1398,
        amt: 2210,
    },
    {
        name: 'Page C',
        uv: 2000,
        pv: 9800,
        amt: 2290,
    },
    {
        name: 'Page D',
        uv: 2780,
        pv: 3908,
        amt: 2000,
    },
    {
        name: 'Page E',
        uv: 1890,
        pv: 4800,
        amt: 2181,
    },
    {
        name: 'Page F',
        uv: 2390,
        pv: 3800,
        amt: 2500,
    },
    {
        name: 'Page G',
        uv: 3490,
        pv: 4300,
        amt: 2100,
    },
];

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

export interface Props extends React.HTMLAttributes<HTMLDivElement> {
    name: string;
    symbol: Network['symbol'];
    cryptoValue: BigNumber | string | number;
    fiatValue: BigNumber | string | number;
    exchangeRate: string | number | null;
    localCurrency: string;
}

const Asset = React.memo(
    ({ name, symbol, cryptoValue, fiatValue, exchangeRate, localCurrency, ...rest }: Props) => {
        const isGraphGreen = Math.random() > 0.5;

        return (
            <Wrapper {...rest}>
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
                                data={data}
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
                                <Area
                                    isAnimationActive={false}
                                    type="monotone"
                                    dataKey="uv"
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

export default Asset;
