import React from 'react';
import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
import { Quote, colors } from '../../../index';

const Wrapper = styled.div`
    margin: 10px 0;
    padding: 20px;
    flex: 1;
    background: ${colors.NEUE_BG_GRAY};
`;

storiesOf('Others', module).add('Quote', () => {
    const quote = {
        exchange: 'simplex',
        receiveStringAmount: '0.0231123166623',
        receiveCurrency: 'BTC',
        paymentMethod: 'paymentMethod',
        infoNote: 'Some blah blah blah.',
    };
    const providers = {
        simplex: {
            name: 'simplex',
            companyName: 'Simplex',
            logo: 'simplex-icon.jpg',
            isActive: true,
            tradedCoins: ['BTC', 'BCH', 'BNB', 'ETH', 'XLM', 'LTC', 'XRP'],
            tradedFiatCurrencies: ['EUR', 'USD'],
            supportedCountries: [],
            paymentMethods: ['creditCard'],
            statusUrl: 'https://payment-status.simplex.com/#/payment/{{paymentId}}',
            supportUrl: 'https://www.simplex.com/support/',
        },
    };
    return (
        <Wrapper>
            <Quote selectQuote={() => {}} quote={quote} providers={providers} />
        </Wrapper>
    );
});
