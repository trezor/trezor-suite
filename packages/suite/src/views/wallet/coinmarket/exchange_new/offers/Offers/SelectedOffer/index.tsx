import styled from 'styled-components';

import { Card, Icon, variables, colors } from '@trezor/components';
import VerifyAddress from './components/VerifyAddress';
import SendTransaction from './components/SendTransaction';
import { Translation } from 'src/components/suite';
import SendApprovalTransaction from './components/SendApprovalTransaction';
import SendSwapTransaction from './components/SendSwapTransaction';
import { CoinmarketExchangeOfferInfo } from '../../../components/ExchangeForm/CoinmarketExchangeOfferInfo';
import { spacingsPx } from '@trezor/theme';
import { useCoinmarketOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { CoinmarketTradeExchangeType } from 'src/types/coinmarket/coinmarket';

const Wrapper = styled.div`
    display: flex;
    margin: ${spacingsPx.lg} 0;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex-direction: column;
    }
`;

const Flex = styled.div`
    flex: 1;
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 25px;
    border-bottom: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
`;

interface ActiveProps {
    active: boolean;
}

const Step = styled.div<ActiveProps>`
    font-weight: ${({ active }) =>
        active ? variables.FONT_WEIGHT.DEMI_BOLD : variables.FONT_WEIGHT.MEDIUM};
    color: ${({ active, theme }) =>
        active ? theme.legacy.TYPE_GREEN : theme.legacy.TYPE_LIGHT_GREY};
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
    flex: 1;
    justify-content: center;
`;

const Left = styled.div`
    display: flex;
    flex: 1;
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-end;
`;

const Middle = styled.div`
    display: flex;
    min-width: 65px;
    height: 48px;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.legacy.STROKE_GREY};
`;

const MiddleNarrow = styled.div`
    display: flex;
    height: 48px;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.legacy.STROKE_GREY};
`;

const SelectedOffer = () => {
    const { account, selectedQuote, exchangeInfo, exchangeStep, receiveAccount } =
        useCoinmarketOffersContext<CoinmarketTradeExchangeType>();
    if (!selectedQuote) return null;

    return (
        <Wrapper>
            <Flex>
                <Card paddingType="none">
                    <Header>
                        <Left>
                            <Step active={exchangeStep === 'RECEIVING_ADDRESS'}>
                                <Translation id="TR_EXCHANGE_VERIFY_ADDRESS_STEP" />
                            </Step>
                        </Left>
                        {selectedQuote.isDex ? (
                            <>
                                <MiddleNarrow>
                                    <Icon
                                        name="chevronRight"
                                        color={colors.legacy.TYPE_LIGHT_GREY}
                                    />
                                </MiddleNarrow>
                                <Left>
                                    <Step active={exchangeStep === 'SEND_APPROVAL_TRANSACTION'}>
                                        <Translation id="TR_EXCHANGE_CREATE_APPROVAL_STEP" />
                                    </Step>
                                </Left>
                                <MiddleNarrow>
                                    <Icon
                                        name="chevronRight"
                                        color={colors.legacy.TYPE_LIGHT_GREY}
                                    />
                                </MiddleNarrow>
                            </>
                        ) : (
                            <Middle>
                                <Icon name="chevronRight" color={colors.legacy.TYPE_LIGHT_GREY} />
                            </Middle>
                        )}
                        <Right>
                            <Step active={exchangeStep === 'SEND_TRANSACTION'}>
                                <Translation id="TR_EXCHANGE_CONFIRM_SEND_STEP" />
                            </Step>
                        </Right>
                    </Header>
                    {exchangeStep === 'RECEIVING_ADDRESS' && <VerifyAddress />}
                    {exchangeStep === 'SEND_TRANSACTION' && !selectedQuote.isDex && (
                        <SendTransaction />
                    )}
                    {exchangeStep === 'SEND_APPROVAL_TRANSACTION' && <SendApprovalTransaction />}
                    {exchangeStep === 'SEND_TRANSACTION' && selectedQuote.isDex && (
                        <SendSwapTransaction />
                    )}
                </Card>
            </Flex>
            <CoinmarketExchangeOfferInfo
                selectedQuote={selectedQuote}
                account={account}
                exchangeInfo={exchangeInfo}
                receiveAccount={receiveAccount}
                data-testid="@coinmarket/exchange/offers/coinmarket-exchange-offer-info"
            />
        </Wrapper>
    );
};

export default SelectedOffer;
