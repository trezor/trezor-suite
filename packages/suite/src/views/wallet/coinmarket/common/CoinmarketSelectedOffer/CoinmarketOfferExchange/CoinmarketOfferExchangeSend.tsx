import styled from 'styled-components';
import { Button, variables } from '@trezor/components';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketTradeExchangeType } from 'src/types/coinmarket/coinmarket';
import { AccountLabeling, Translation } from 'src/components/suite';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 10px;
`;

const LabelText = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
`;

const Value = styled.div`
    padding-top: 6px;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.legacy.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const ButtonWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 20px;
    border-top: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
    margin: 20px 0;
`;

const Row = styled.div`
    margin: 24px;
`;

const Address = styled.div``;

export const CoinmarketOfferExchangeSend = () => {
    const { account, callInProgress, selectedQuote, exchangeInfo, sendTransaction } =
        useCoinmarketFormContext<CoinmarketTradeExchangeType>();
    if (!selectedQuote) return null;
    const { exchange, sendAddress } = selectedQuote;
    if (!exchange) return null;
    const providerName =
        exchangeInfo?.providerInfos[exchange]?.companyName || selectedQuote.exchange;

    return (
        <Wrapper>
            <Row>
                <LabelText>
                    <Translation id="TR_EXCHANGE_SEND_FROM" />
                </LabelText>
                <Value>
                    <AccountLabeling account={account} />
                </Value>
            </Row>
            <Row>
                <LabelText>
                    <Translation id="TR_EXCHANGE_SEND_TO" values={{ providerName }} />
                </LabelText>
                <Value>
                    <Address>{sendAddress}</Address>
                </Value>
            </Row>

            <ButtonWrapper>
                <Button
                    data-testid="@coinmarket/offer/exchange/confirm-on-trezor-and-send"
                    isLoading={callInProgress}
                    onClick={sendTransaction}
                >
                    <Translation id="TR_EXCHANGE_CONFIRM_ON_TREZOR_SEND" />
                </Button>
            </ButtonWrapper>
        </Wrapper>
    );
};
