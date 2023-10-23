import styled from 'styled-components';
import { ExchangeTrade } from 'invity-api';
import { variables, CoinLogo } from '@trezor/components';
import {
    CoinmarketProviderInfo,
    CoinmarketTransactionId,
} from 'src/views/wallet/coinmarket/common';
import { Account } from 'src/types/wallet';
import {
    AccountLabeling,
    FormattedCryptoAmount,
    QuestionTooltip,
    Translation,
} from 'src/components/suite';
import { ExchangeInfo } from 'src/actions/wallet/coinmarketExchangeActions';
import invityAPI from 'src/services/suite/invityAPI';

const Wrapper = styled.div`
    margin: 0 0 0 30px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        margin: 0;
    }
`;

const AccountText = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    padding-left: 7px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Info = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 350px;

    padding-top: 10px;
    min-height: 200px;
    border: 1px solid ${({ theme }) => theme.STROKE_GREY};
    border-radius: 4px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex: 1;
        margin: 20px 0 10px 0;
        width: 100%;
    }
`;

const LeftColumn = styled.div`
    display: flex;
    flex: 1;
    font-size: ${variables.FONT_SIZE.SMALL};
    text-transform: uppercase;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const RightColumn = styled.div`
    display: flex;
    justify-content: flex-end;
    flex: 1;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const Row = styled.div`
    display: flex;
    margin: 18px 24px;
    white-space: nowrap;
    justify-content: space-between;
`;

const AdjacentRow = styled.div`
    display: flex;
    margin: -15px 24px 10px 24px;
`;

const Dark = styled.div`
    display: flex;
    align-items: center;
    font-size: ${variables.FONT_SIZE.NORMAL};
    justify-content: flex-end;
    flex: 1;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

const RowWithBorder = styled(Row)`
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
    margin-bottom: 0px;
    margin-top: 10px;
    padding-bottom: 10px;
    padding-top: 10px;
`;

const Middle = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Amount = styled.span`
    padding-left: 5px;
`;

const StyledQuestionTooltip = styled(QuestionTooltip)`
    padding-left: 3px;
`;

const InvityCoinLogo = styled.img`
    height: 16px;
`;

const AccountType = styled.span`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    padding-left: 5px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface CoinmarketExchangeOfferInfoProps {
    selectedQuote: ExchangeTrade;
    transactionId?: string;
    exchangeInfo?: ExchangeInfo;
    account: Account;
    receiveAccount?: Account;
}

export const CoinmarketExchangeOfferInfo = ({
    selectedQuote,
    transactionId,
    exchangeInfo,
    account,
    receiveAccount,
}: CoinmarketExchangeOfferInfoProps) => {
    const { exchange, receiveStringAmount, receive, sendStringAmount, send } = selectedQuote;
    const provider =
        exchangeInfo?.providerInfos && exchange ? exchangeInfo?.providerInfos[exchange] : undefined;

    if (!provider) return null;

    return (
        <Wrapper>
            <Info>
                <Row>
                    <LeftColumn>
                        <Translation id="TR_EXCHANGE_SELL" />
                    </LeftColumn>
                    <RightColumn>
                        <Dark>
                            <CoinLogo symbol={account.symbol} size={16} />
                            <Amount>
                                <FormattedCryptoAmount value={sendStringAmount} symbol={send} />
                            </Amount>
                        </Dark>
                    </RightColumn>
                </Row>
                <AdjacentRow>
                    <RightColumn>
                        <AccountText>
                            <AccountLabeling account={account} />
                            <AccountType>
                                {account.accountType !== 'normal' ? account.accountType : ''}
                            </AccountType>
                        </AccountText>
                    </RightColumn>
                </AdjacentRow>
                <Row>
                    <LeftColumn>
                        <Translation id="TR_EXCHANGE_BUY" />
                    </LeftColumn>
                    <RightColumn>
                        <Dark>
                            <InvityCoinLogo
                                src={`${invityAPI.getApiServerUrl()}/images/coins/suite/${receive}.svg`}
                            />
                            <Amount>
                                {(!provider.isFixedRate || selectedQuote.isDex) && '≈ '}
                                <FormattedCryptoAmount
                                    value={receiveStringAmount}
                                    symbol={receive}
                                />
                            </Amount>
                        </Dark>
                    </RightColumn>
                </Row>
                {receiveAccount && (
                    <AdjacentRow>
                        <RightColumn>
                            <AccountText>
                                <AccountLabeling account={receiveAccount} />
                                <AccountType>
                                    {receiveAccount.accountType !== 'normal'
                                        ? receiveAccount.accountType
                                        : ''}
                                </AccountType>
                            </AccountText>
                        </RightColumn>
                    </AdjacentRow>
                )}
                <RowWithBorder>
                    <Middle>
                        {provider.isFixedRate && !selectedQuote.isDex && (
                            <>
                                <Translation id="TR_EXCHANGE_FIXED" />
                                <StyledQuestionTooltip tooltip="TR_EXCHANGE_FIXED_OFFERS_INFO" />
                            </>
                        )}
                        {!provider.isFixedRate && !selectedQuote.isDex && (
                            <>
                                <Translation id="TR_EXCHANGE_FLOAT" />
                                <StyledQuestionTooltip tooltip="TR_EXCHANGE_FLOAT_OFFERS_INFO" />
                            </>
                        )}
                        {selectedQuote.isDex && <Translation id="TR_EXCHANGE_DEX" />}
                    </Middle>
                </RowWithBorder>
                <Row>
                    <LeftColumn>
                        <Translation id="TR_EXCHANGE_PROVIDER" />
                    </LeftColumn>
                    <RightColumn>
                        <CoinmarketProviderInfo
                            exchange={exchange}
                            providers={exchangeInfo?.providerInfos}
                            data-test="@CoinmarketExchangeProviderInfo"
                        />
                    </RightColumn>
                </Row>
            </Info>
            {transactionId && <CoinmarketTransactionId transactionId={transactionId} />}
        </Wrapper>
    );
};
