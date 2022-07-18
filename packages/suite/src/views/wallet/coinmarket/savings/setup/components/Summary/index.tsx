import React from 'react';
import styled from 'styled-components';
import { FormattedCryptoAmount, FormattedFiatAmount, Translation } from '@suite-components';
import { NetworkSymbol } from '@wallet-types';

const SummaryWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    border-top: 1px solid ${props => props.theme.BG_GREY};
    border-bottom: 1px solid ${props => props.theme.BG_GREY};
    margin: 15px 0;
    padding: 15px 0;
`;

const Left = styled.div`
    display: flex;
    font-size: 16px;
    line-height: 24px;
    align-items: center;
`;

const Right = styled.div`
    display: flex;
    flex-direction: column;
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

interface Props {
    fiatCurrency?: string;
    annualSavingsFiatAmount: number;
    annualSavingsCryptoAmount: string;
    accountSymbol: NetworkSymbol;
}

const Summary = ({
    accountSymbol,
    annualSavingsCryptoAmount,
    annualSavingsFiatAmount,
    fiatCurrency,
}: Props) => (
    <SummaryWrapper>
        <Left>
            <Translation id="TR_SAVINGS_SETUP_SUMMARY_LABEL" />
        </Left>
        <Right>
            <Fiat>
                <FormattedFiatAmount currency={fiatCurrency} value={annualSavingsFiatAmount} />
            </Fiat>
            <Crypto>
                ≈&nbsp;
                <FormattedCryptoAmount value={annualSavingsCryptoAmount} symbol={accountSymbol} />
            </Crypto>
        </Right>
    </SummaryWrapper>
);

export default Summary;
