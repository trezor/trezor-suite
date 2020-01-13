import React from 'react';
import styled from 'styled-components';
import { colors, variables, H1, H2, Button, CoinLogo } from '@trezor/components-v2';
import Card from '@suite-components/Card';
import { Account } from '@wallet-types';
import { AppState } from '@suite/types/suite';
import { connect } from 'react-redux';
import { getAccountBalance } from '@suite/utils/wallet/accountUtils';
import Badge from '@suite-components/Badge';
import FormattedNumber from '@suite-components/FormattedNumber';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const TopPanel = styled(Card)`
    width: 100%;
    border-radius: 6px;
    /* border: solid 2px ${colors.BLACK96}; */
    margin-bottom: 80px;
    padding: 20px;
    align-items: center;
    justify-content: space-between;
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 520px;
`;

const Balance = styled.div`
    font-size: ${variables.FONT_SIZE.H1};
    font-weight: ${variables.FONT_WEIGHT.LIGHT};
    margin: 0px 10px;
`;

const Title = styled(H2)`
    display: flex;
    text-align: center;
    color: #000000;
`;

const Description = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    text-align: center;
    color: ${colors.BLACK50};
    margin-bottom: 10px;
`;

const Image = styled.div`
    width: 340px;
    height: 280px;
    background: #f5f5f5;
    margin-bottom: 40px;
`;

const Actions = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
`;

const ActionButton = styled(Button)`
    min-width: 160px;
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
    margin-bottom: 4px;
`;

const TickerPrice = styled.div`
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

interface OwnProps {
    account: Account;
}

const NoTransactions = (props: Props) => {
    const { localCurrency } = props.wallet.settings;
    const fiatBalance = getAccountBalance(props.account, localCurrency, props.fiat) || 0;
    const fiatRates = props.fiat.find(f => f.symbol === props.account.symbol);
    const fiatRateValue = fiatRates ? fiatRates.rates[localCurrency] : null;

    return (
        <Wrapper>
            <TopPanel>
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
                        <TickerTitle>
                            Bitcoin price ({props.account.symbol.toUpperCase()})
                        </TickerTitle>
                        <TickerPrice>
                            {fiatRateValue && (
                                <FormattedNumber value={fiatRateValue} currency={localCurrency} />
                            )}
                        </TickerPrice>
                    </Ticker>
                </Col>
            </TopPanel>
            <Content>
                <Title>This account is empty</Title>
                <Description>
                    Once you send or receive your first transaction it will show up here. Until
                    then, wanna buy some crypto? Click the button below to begin your shopping
                    spree!
                </Description>
                <Image />
                <Actions>
                    <ActionButton variant="secondary">Receive BTC</ActionButton>
                    <ActionButton variant="primary">Buy BTC</ActionButton>
                </Actions>
            </Content>
        </Wrapper>
    );
};

const mapStateToProps = (state: AppState) => ({
    wallet: state.wallet,
    suite: state.suite,
    fiat: state.wallet.fiat,
});

const mapDispatchToProps = () => ({});

export type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    OwnProps;

export default connect(mapStateToProps, mapDispatchToProps)(NoTransactions);
