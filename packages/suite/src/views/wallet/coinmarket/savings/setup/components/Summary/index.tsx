import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { NetworkSymbol } from 'src/types/wallet';

const SummaryWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    border-top: 1px solid ${({ theme }) => theme.BG_GREY};
    border-bottom: 1px solid ${({ theme }) => theme.BG_GREY};
    margin: 34px 0;
    padding: 14px 0;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
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

const StyledFiatValue = styled(FiatValue)`
    font-size: 20px;
    line-height: 28px;
    color: ${({ theme }) => theme.TYPE_GREEN};
    justify-content: end;
    display: flex;
`;

const Crypto = styled.div`
    font-size: 20px;
    line-height: 28px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
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
            <StyledFiatValue
                shouldConvert={false}
                fiatCurrency={fiatCurrency}
                amount={annualSavingsFiatAmount.toString()}
                symbol={accountSymbol}
            />
            <Crypto>
                ≈&nbsp;
                <FormattedCryptoAmount value={annualSavingsCryptoAmount} symbol={accountSymbol} />
            </Crypto>
        </Right>
    </SummaryWrapper>
);

export default Summary;
