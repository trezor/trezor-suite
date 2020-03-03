import React from 'react';
import styled from 'styled-components';
import { Account } from '@wallet-types';
import { AppState } from '@suite-types';
import { connect } from 'react-redux';
import { CoinLogo, variables } from '@trezor/components';
import { NoRatesTooltip, HiddenPlaceholder, Badge, FiatValue } from '@suite-components';
import LastWeekGraph from '../LastWeekGraph';

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
`;

const AssetName = styled.div`
    color: #808080;
    font-size: 12px;
    padding-top: 1px;
`;

// Similar Badge in DeviceItem (part of switch device modal)
// TOOD: refactor to single component
const SmallBadge = styled(Badge)`
    font-size: ${variables.FONT_SIZE.TINY};
`;

const Col = styled.div`
    display: flex;
    align-items: center;
`;

const GraphWrapper = styled(Col)`
    min-height: 24px;
    flex: 1;
    width: 100%;
    height: 24px;
    /* margin-right: 20px; */
`;
const CryptoValueWrapper = styled(Col)`
    flex: 1;
    justify-content: flex-end;
    margin-right: 32px;
    text-align: right;
    white-space: nowrap;
`;
const FiatValueWrapper = styled(Col)``;

interface OwnProps extends React.HTMLAttributes<HTMLDivElement> {
    name: string;
    symbol: Account['symbol'];
    cryptoValue: string;
    localCurrency: string;
}

const mapStateToProps = (state: AppState) => ({
    fiat: state.wallet.fiat,
});

export type Props = ReturnType<typeof mapStateToProps> & OwnProps;

const Asset = React.memo(({ name, symbol, cryptoValue, localCurrency, ...props }: Props) => {
    const lastWeekData = props.fiat.find(r => r.symbol === symbol)?.lastWeek?.tickers;

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
                    <HiddenPlaceholder>
                        {cryptoValue} {symbol.toUpperCase()}{' '}
                    </HiddenPlaceholder>
                </CryptoValueWrapper>
            </Col>
            <Col>
                <FiatValueWrapper>
                    <HiddenPlaceholder>
                        <FiatValue amount={cryptoValue} symbol={symbol}>
                            {({ value }) => (value ? <SmallBadge>{value}</SmallBadge> : null)}
                        </FiatValue>
                    </HiddenPlaceholder>
                </FiatValueWrapper>
            </Col>
            <Col>
                <GraphWrapper>
                    <LastWeekGraph
                        lastWeekData={lastWeekData}
                        symbol={symbol}
                        localCurrency={localCurrency}
                    />
                </GraphWrapper>
            </Col>
            <Col>
                <FiatValue amount={cryptoValue} symbol={symbol}>
                    {({ rate }) => {
                        return rate ? (
                            <SmallBadge>
                                1 {symbol.toUpperCase()} = {rate}
                            </SmallBadge>
                        ) : (
                            <NoRatesTooltip />
                        );
                    }}
                </FiatValue>
            </Col>
        </Wrapper>
    );
});

export default connect(mapStateToProps)(Asset);
