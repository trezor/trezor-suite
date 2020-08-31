import React from 'react';
import styled from 'styled-components';
import { BuyTrade } from 'invity-api';
import { colors, variables } from '@trezor/components';
import {
    CoinmarketPaymentType,
    CoinmarketProviderInfo,
    CoinmarketTransactionId,
} from '@wallet-components';
import { Translation } from '@suite-components';

interface Props {
    selectedQuote: BuyTrade;
    transactionId?: string;
}

const OfferInfo = ({ selectedQuote, transactionId }: Props) => {
    const {
        receiveStringAmount,
        receiveCurrency,
        exchange,
        paymentMethod,
        fiatCurrency,
        fiatStringAmount,
    } = selectedQuote;

    return (
        <Wrapper>
            <Info>
                <Row>
                    <LeftColumn>
                        <Translation id="TR_BUY_SPEND" />
                    </LeftColumn>
                    <RightColumn>
                        <Dark>
                            {fiatStringAmount} {fiatCurrency}
                        </Dark>
                    </RightColumn>
                </Row>
                <RowWithBorder>
                    <LeftColumn>
                        <Translation id="TR_BUY_BUY" />
                    </LeftColumn>
                    <RightColumn>
                        <Dark>{`${receiveStringAmount} ${receiveCurrency}`}</Dark>
                    </RightColumn>
                </RowWithBorder>
                <Row>
                    <LeftColumn>
                        <Translation id="TR_BUY_PROVIDER" />
                    </LeftColumn>
                    <RightColumn>
                        <CoinmarketProviderInfo exchange={exchange} />
                    </RightColumn>
                </Row>
                <Row>
                    <LeftColumn>
                        <Translation id="TR_BUY_PAID_BY" />
                    </LeftColumn>
                    <RightColumn>
                        <CoinmarketPaymentType method={paymentMethod} />
                    </RightColumn>
                </Row>
            </Info>
            {transactionId && <CoinmarketTransactionId transactionId={transactionId} />}
        </Wrapper>
    );
};

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex: 1;
    }
`;

const Info = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 350px;
    margin: 0 0 10px 30px;
    min-height: 200px;
    border: 1px solid ${colors.NEUE_STROKE_GREY};
    border-radius: 4px;
    padding-top: 10px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex: 1;
        margin: 20px 0 10px 0;
        width: 100%;
    }
`;

const LeftColumn = styled.div`
    display: flex;
    flex: 1;
    text-transform: uppercase;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

const RightColumn = styled.div`
    display: flex;
    justify-content: flex-end;
    flex: 1;
`;

const Row = styled.div`
    display: flex;
    margin: 5px 24px;
`;

const Dark = styled.div`
    display: flex;
    justify-content: flex-end;
    flex: 1;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${colors.NEUE_TYPE_DARK_GREY};
`;

const RowWithBorder = styled(Row)`
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
    margin-bottom: 10px;
    padding-bottom: 10px;
`;

// const StyledTransactionId = styled(CoinmarketTransactionId)`
//     margin: 0 0 10px 30px;
// `;

export default OfferInfo;
