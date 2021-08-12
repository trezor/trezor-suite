import React from 'react';
import styled from 'styled-components';
import { Translation, AccountLabeling } from '@suite-components';
import { Button, variables } from '@trezor/components';
import { useCoinmarketSellOffersContext } from '@wallet-hooks/useCoinmarketSellOffers';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 10px;
`;

const LabelText = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const Value = styled.div`
    padding-top: 6px;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const ButtonWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 20px;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
    margin: 20px 0;
`;

const Row = styled.div`
    margin: 24px;
`;

const Address = styled.div``;

const StyledButton = styled(Button)`
    display: flex;
    min-width: 200px;
`;

const SendTransactionComponent = () => {
    const { account, callInProgress, selectedQuote, sellInfo, sendTransaction } =
        useCoinmarketSellOffersContext();
    if (!selectedQuote || !selectedQuote.exchange) return null;
    const { exchange, destinationAddress } = selectedQuote;
    const providerName = sellInfo?.providerInfos[exchange]?.companyName || exchange;
    return (
        <Wrapper>
            <Row>
                <LabelText>
                    <Translation id="TR_SELL_SEND_FROM" />
                </LabelText>
                <Value>
                    <AccountLabeling account={account} />
                </Value>
            </Row>
            <Row>
                <LabelText>
                    <Translation id="TR_SELL_SEND_TO" values={{ providerName }} />
                </LabelText>
                <Value>
                    <Address>{destinationAddress}</Address>
                </Value>
            </Row>

            <ButtonWrapper>
                <StyledButton isLoading={callInProgress} onClick={sendTransaction}>
                    <Translation id="TR_SELL_CONFIRM_ON_TREZOR_SEND" />
                </StyledButton>
            </ButtonWrapper>
        </Wrapper>
    );
};

export default SendTransactionComponent;
