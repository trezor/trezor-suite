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
    return (
        <Wrapper>
            <Quote
                selectQuote={() => {}}
                exchange="exchange"
                receiveStringAmount="0.0231123166623"
                receiveCurrency="BTC"
                paymentMethod="paymentMethod"
            />
        </Wrapper>
    );
});
