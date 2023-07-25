import React from 'react';
import styled from 'styled-components';
import { Translation, FormattedDate, FormattedCryptoAmount } from 'src/components/suite';
import { variables } from '@trezor/components';
import Status from '../Status';
import { CoinmarketProviderInfo } from 'src/components/wallet';
import { SellProviderInfo } from 'invity-api';
import { TradeSpend } from 'src/types/wallet/coinmarketCommonTypes';

interface Props {
    trade: TradeSpend;
    providers?: {
        [name: string]: SellProviderInfo;
    };
}

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    margin-bottom: 20px;
    border: 1px solid ${({ theme }) => theme.STROKE_GREY};
    border-radius: 4px;
    padding: 12px 0;

    &:hover {
        background: ${({ theme }) => theme.BG_WHITE};
        border: 1px solid ${({ theme }) => theme.TYPE_WHITE};
        box-shadow: 0 1px 2px 0 ${({ theme }) => theme.BOX_SHADOW_BLACK_20};
    }

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

const Row = styled.div`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Column = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 17px 24px;
    overflow: hidden;
`;

const Amount = styled.div``;

const SmallRow = styled.div`
    padding-top: 8px;
    display: flex;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.TINY};
`;

const SmallRowStatus = styled(SmallRow)`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const StyledStatus = styled(Status)`
    margin-left: 5px;
`;

const TradeID = styled.span`
    padding-left: 5px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    overflow: hidden;
    text-overflow: ellipsis;
`;

const ProviderColumn = styled(Column)`
    max-width: 330px;
`;

const SpendTransaction = ({ trade, providers }: Props) => {
    const { date, data, tradeType } = trade;
    const { exchange } = data;
    const { cryptoAmount, cryptoCurrency, paymentId } = data;

    return (
        <Wrapper>
            <Column>
                <Row>
                    <Amount>
                        <FormattedCryptoAmount value={cryptoAmount} symbol={cryptoCurrency} />
                    </Amount>
                </Row>
                <SmallRowStatus>
                    {tradeType.toUpperCase()} • <FormattedDate value={date} date time /> •{' '}
                    <StyledStatus trade={data} tradeType={tradeType} />
                </SmallRowStatus>
                <SmallRow>
                    <Translation id="TR_SPEND_TRANS_ID" />
                    <TradeID>{paymentId}</TradeID>
                </SmallRow>
            </Column>
            <ProviderColumn>
                <Row>
                    <CoinmarketProviderInfo exchange={exchange} providers={providers} />
                </Row>
            </ProviderColumn>
        </Wrapper>
    );
};

export default SpendTransaction;
