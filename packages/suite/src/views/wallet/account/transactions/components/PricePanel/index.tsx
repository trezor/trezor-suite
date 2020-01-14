import React from 'react';
import styled from 'styled-components';
import { colors, variables, CoinLogo } from '@trezor/components-v2';
import Card from '@suite-components/Card';
import { AppState } from '@suite/types/suite';
import { getAccountBalance, getTitleForNetwork } from '@wallet-utils/accountUtils';
import Badge from '@suite-components/Badge';
import { Account } from '@wallet-types';
import FormattedNumber from '@suite-components/FormattedNumber';
import { Translation } from '@suite-components/Translation';
import { connect } from 'react-redux';

const Wrapper = styled(Card)`
    width: 100%;
    border-radius: 6px;
    /* border: solid 2px ${colors.BLACK96}; */
    /* box-shadow: none; */
    margin-bottom: 80px;
    padding: 20px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
`;

const Balance = styled.div`
    font-size: ${variables.FONT_SIZE.H1};
    font-weight: ${variables.FONT_WEIGHT.LIGHT};
    margin: 0px 10px;
    white-space: nowrap;
`;

const Col = styled.div`
    display: flex;
    align-items: center;
`;

const Ticker = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 240px;
    border-radius: 3px;
    background: ${colors.BLACK92};
    padding: 8px 10px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const TickerTitle = styled.div`
    text-transform: uppercase;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: #a0a0a0;
`;

const TickerPrice = styled.div`
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const Row = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
`;

const Live = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${colors.GREEN};
    align-items: center;
    text-transform: uppercase;
`;

const Dot = styled.div`
    display: flex;
    width: 6px;
    height: 6px;
    background-color: ${colors.GREEN};
    border-radius: 50%;
    margin-right: 3px;
`;

interface OwnProps {
    account: Account;
}

const PricePanel = (props: Props) => {
    const { localCurrency } = props.settings;
    const fiatBalance = getAccountBalance(props.account, localCurrency, props.fiat) || 0;
    const fiatRates = props.fiat.find(f => f.symbol === props.account.symbol);
    const fiatRateValue = fiatRates ? fiatRates.rates[localCurrency] : null;

    return (
        <Wrapper>
            <Col>
                <CoinLogo size={24} symbol={props.account.symbol} />
                <Balance>
                    {props.account.formattedBalance} {props.account.symbol.toUpperCase()}
                </Balance>
                <Badge>
                    <FormattedNumber value={fiatBalance} currency={localCurrency} />
                </Badge>
            </Col>
            <Col>
                <Ticker>
                    <Row>
                        <TickerTitle>
                            <Translation {...getTitleForNetwork(props.account.symbol)} /> price (
                            {props.account.symbol.toUpperCase()})
                        </TickerTitle>
                        <Live>
                            <Dot /> Live
                        </Live>
                    </Row>
                    <TickerPrice>
                        {fiatRateValue && (
                            <FormattedNumber value={fiatRateValue} currency={localCurrency} />
                        )}
                    </TickerPrice>
                </Ticker>
            </Col>
        </Wrapper>
    );
};

const mapStateToProps = (state: AppState) => ({
    settings: state.wallet.settings,
    fiat: state.wallet.fiat,
});

const mapDispatchToProps = () => ({});

export type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    OwnProps;

export default connect(mapStateToProps, mapDispatchToProps)(PricePanel);
