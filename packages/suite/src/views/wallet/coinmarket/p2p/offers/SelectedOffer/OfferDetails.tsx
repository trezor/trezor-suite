import styled from 'styled-components';
import { P2pProviderInfo, P2pQuote, P2pQuotesRequest } from 'invity-api';

import { useFormatters } from '@suite-common/formatters';
import { AccountLabeling, Translation } from 'src/components/suite';
import { CoinLogo, variables } from '@trezor/components';
import { Account } from 'src/types/wallet';
import { CoinmarketProviderInfo } from 'src/views/wallet/coinmarket/common';
import { Avatar } from '../Avatar';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex: 1;
    }
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
    margin-bottom: 5px;
    padding: 15px 24px;
    max-width: 340px;
`;

const AccountText = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    padding-left: 7px;
`;

const Info = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 350px;
    margin: 0 0 10px 30px;
    padding-bottom: 10px;
    min-height: 200px;
    border: 1px solid ${({ theme }) => theme.STROKE_GREY};
    border-radius: 4px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex: 1;
        margin: 20px 0 10px;
        width: 100%;
    }
`;

const LeftColumn = styled.div`
    display: flex;
    flex: 1;
    text-transform: capitalize;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    align-self: center;
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

const RowWithBorder = styled(Row)`
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
    margin-bottom: 10px;
    padding-bottom: 10px;
`;

const Dark = styled.div`
    display: flex;
    justify-content: flex-end;
    flex: 1;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

interface OfferDetailsProps {
    account: Account;
    providers?: { [name: string]: P2pProviderInfo };
    quotesRequest: P2pQuotesRequest;
    selectedQuote: P2pQuote;
}

export const OfferDetails = ({
    account,
    providers,
    quotesRequest,
    selectedQuote,
}: OfferDetailsProps) => {
    const { FiatAmountFormatter } = useFormatters();
    const { amount, currency } = quotesRequest;
    const { provider, trader, paymentWindowMinutes, confirmations } = selectedQuote;

    return (
        <Wrapper>
            <Info>
                <Header>
                    <CoinLogo symbol={account.symbol} size={16} />
                    <AccountText>
                        <AccountLabeling account={account} />
                    </AccountText>
                </Header>
                <Row>
                    <LeftColumn>
                        <Translation id="TR_P2P_AMOUNT" />
                    </LeftColumn>
                    <RightColumn>
                        <Dark>
                            <FiatAmountFormatter value={amount} currency={currency} />
                        </Dark>
                    </RightColumn>
                </Row>
                <Row>
                    <LeftColumn>
                        <Translation id="TR_P2P_USER" />
                    </LeftColumn>
                    <RightColumn>
                        <Dark>
                            <Avatar onlineStatus={trader.onlineStatus} />
                            {trader.name}
                        </Dark>
                    </RightColumn>
                </Row>
                <Row>
                    <LeftColumn>
                        <Translation id="TR_P2P_PAYMENT_WINDOW" />
                    </LeftColumn>
                    <RightColumn>
                        <Dark>
                            {paymentWindowMinutes}
                            &nbsp;
                            <Translation id="TR_P2P_PAYMENT_WINDOW_MINUTES" />
                        </Dark>
                    </RightColumn>
                </Row>
                <RowWithBorder>
                    <LeftColumn>
                        <Translation id="TR_P2P_CONFIRMATIONS" />
                    </LeftColumn>
                    <RightColumn>
                        <Dark>{confirmations}</Dark>
                    </RightColumn>
                </RowWithBorder>
                <Row>
                    <LeftColumn>
                        <Translation id="TR_P2P_PROVIDER" />
                    </LeftColumn>
                    <RightColumn>
                        <CoinmarketProviderInfo providers={providers} exchange={provider} />
                    </RightColumn>
                </Row>
            </Info>
        </Wrapper>
    );
};
