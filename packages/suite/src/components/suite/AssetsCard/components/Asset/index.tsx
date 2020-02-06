import React from 'react';
import styled from 'styled-components';
import { Network } from '@wallet-types';
import { CoinLogo, variables } from '@trezor/components-v2';
import BigNumber from 'bignumber.js';
import { FormattedNumber, NoRatesTooltip } from '@suite-components';
import Badge from '@suite-components/Badge';
import { AppState } from '@suite-types';
import { connect } from 'react-redux';
import LastWeekGraph from './components/LastWeekGraph';

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
                        <LastWeekGraph
                            lastWeekData={lastWeekData}
                            symbol={symbol}
                            localCurrency={localCurrency}
                        />
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
