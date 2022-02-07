import React from 'react';
import { withCoinmarketSavingsLoaded } from '@wallet-components';
import styled from 'styled-components';
import { Icon } from '@trezor/components';
import { FormattedCryptoAmount, FormattedNumber } from '@suite-components';

const Wrapper = styled.div`
    display: flex;
    flex-flow: column;
`;

const SavingsOverviewHeader = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: stretch;
    align-content: stretch;
`;

const Setup = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: stretch;
    align-content: stretch;
    width: 100%;
    background-color: ${props => props.theme.BG_GREY};
    padding: 21px;
    border-radius: 8px;
`;

const SetupValues = styled.div``;

const FiatPayment = styled.div`
    font-size: 30px;
    line-height: 34px;
`;

const PaymentFrequency = styled.div`
    font-size: 16px;
    line-height: 24px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const SoFarSaved = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    background-color: ${props => props.theme.BG_WHITE};
    padding: 21px;
`;

const Graph = styled.div`
    display: flex;
    width: 100%;
    background-color: ${props => props.theme.BG_WHITE};
`;

const Fiat = styled.div`
    font-size: 20px;
    line-height: 28px;
    color: ${props => props.theme.TYPE_GREEN};
    justify-content: end;
    display: flex;
`;

const Crypto = styled.div`
    font-size: 20px;
    line-height: 28px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    justify-content: end;
    display: flex;
`;

const NextPayment = styled.div``;

const Overview = () => {
    console.log('TODO');

    // TODO: translations
    return (
        <Wrapper>
            <SavingsOverviewHeader>
                <Setup>
                    <SetupValues>
                        <FiatPayment>
                            <FormattedNumber value={500} currency="EUR" />
                        </FiatPayment>
                        <PaymentFrequency>each week</PaymentFrequency>
                    </SetupValues>
                    <Icon icon="PENCIL" />
                </Setup>
                <SoFarSaved>
                    <Fiat>
                        <FormattedNumber currency="EUR" value={0} />
                    </Fiat>
                    <Crypto>
                        ≈&nbsp;
                        <FormattedCryptoAmount value={0} symbol="btc" />
                    </Crypto>
                </SoFarSaved>
                <Graph>Graph</Graph>
            </SavingsOverviewHeader>
            <NextPayment>next payment</NextPayment>
        </Wrapper>
    );
};
export default withCoinmarketSavingsLoaded(Overview, {
    title: 'TR_NAV_TRADE',
    redirectUnauthorizedUserToLogin: true,
});
