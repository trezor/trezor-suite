import { FormattedNumber } from 'react-intl';
import styled, { useTheme } from 'styled-components';
import BigNumber from 'bignumber.js';

import { useFormatters } from '@suite-common/formatters';
import { Translation } from 'src/components/suite';
import { Button, H3, Icon, Tooltip, variables } from '@trezor/components';
import regional from 'src/constants/wallet/coinmarket/regional';
import { useCoinmarketP2pOffersContext } from 'src/hooks/wallet/useCoinmarketP2pOffers';
import { CoinmarketFiatAmount, CoinmarketProviderInfo } from 'src/views/wallet/coinmarket/common';
import { P2pQuote, P2pQuotesRequest } from 'invity-api';
import { Avatar } from '../Avatar';
import { borders } from '@trezor/theme';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    border-radius: ${borders.radii.xs};
    flex: 1;
    width: 100%;
    min-height: 150px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    background: ${({ theme }) => theme.BG_WHITE};
`;

const Main = styled.div`
    display: flex;
    margin: 30px 30px 0;
    justify-content: space-between;
    padding-bottom: 20px;
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
        margin: 20px 20px 0;
    }
`;

const MainColumn = styled.div`
    display: flex;
    flex: initial;
    flex-direction: column;
    width: 33.33%;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        width: auto;
    }
`;

const MainColumnRight = styled.div`
    display: flex;
    flex: initial;
    width: 33.33%;
    justify-content: flex-end;
    align-items: flex-start;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        justify-content: center;
        padding-top: 10px;
    }
`;

const MainHeading = styled.div`
    display: flex;
    margin-bottom: 5px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-transform: capitalize;
`;

const MainValue = styled(H3)`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.REGULAR};

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding-bottom: 10px;
    }
`;

const StyledButton = styled(Button)`
    width: 180px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        width: 100%;
    }
`;

const Details = styled.div`
    display: flex;
    min-height: 20px;
    flex-wrap: wrap;
    padding: 10px 30px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
        padding: 10px 20px;
    }
`;

const DetailColumn = styled.div`
    display: flex;
    padding: 10px 0;
    width: 33.33%;
    flex: initial;
    flex-direction: column;
    justify-content: flex-start;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        width: auto;
    }
`;

const DetailHeading = styled.div`
    display: flex;
    text-transform: capitalize;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    padding-bottom: 9px;
`;

const DetailValue = styled.div`
    display: flex;
    align-items: center;
    margin-right: 20px;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    overflow-wrap: anywhere;
`;

const Name = styled.div`
    margin-right: 4px;
`;

const Reputation = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
`;

const ErrorFooter = styled.div`
    display: flex;
    margin: 0 30px;
    padding: 10px 0;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    color: ${({ theme }) => theme.TYPE_RED};

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin: 0 20px;
    }
`;

const StyledIcon = styled(Icon)`
    padding-top: 8px;
`;

const IconWrapper = styled.div`
    padding-right: 3px;
`;

const ErrorText = styled.div``;

export const QuoteError = (quote: P2pQuote, quotesRequest: P2pQuotesRequest) => {
    if (quote.currency !== quotesRequest.currency) {
        return;
    }

    const { amount, currency } = quotesRequest;
    const { amountRange } = quote;

    if (Number(amount) < Number(amountRange.minimum)) {
        return (
            <Translation
                id="TR_P2P_WARNING_AMOUNT_RANGE_MINIMUM"
                values={{
                    amount: <CoinmarketFiatAmount amount={amount} currency={currency} />,
                    minimum: (
                        <CoinmarketFiatAmount amount={amountRange.minimum} currency={currency} />
                    ),
                }}
            />
        );
    }

    if (Number(amount) > Number(amountRange.maximum)) {
        return (
            <Translation
                id="TR_P2P_WARNING_AMOUNT_RANGE_MAXIMUM"
                values={{
                    amount: <CoinmarketFiatAmount amount={amount} currency={currency} />,
                    maximum: (
                        <CoinmarketFiatAmount amount={amountRange.maximum} currency={currency} />
                    ),
                }}
            />
        );
    }
};

interface QuoteProps {
    quote: P2pQuote;
}

export const Quote = ({ quote }: QuoteProps) => {
    const theme = useTheme();
    const { FiatAmountFormatter } = useFormatters();
    const { providers, quotesRequest, selectQuote } = useCoinmarketP2pOffersContext();

    if (!providers || !quotesRequest) {
        return null;
    }

    const {
        provider,
        assetCode,
        countryCode,
        title,
        currency,
        price,
        amountRange,
        trader,
        paymentWindowMinutes,
        paymentMethods,
    } = quote;
    const providerName = providers[provider].companyName;
    const location = regional.countriesMap.get(countryCode || regional.unknownCountry);
    const rating = trader.rating && new BigNumber(trader.rating).toNumber();
    const paymentMethod = paymentMethods.map(pm => pm.description).join(', ');
    const quoteError = QuoteError(quote, quotesRequest);

    return (
        <Wrapper>
            <Main>
                <MainColumn>
                    <MainHeading>
                        <Tooltip
                            content={
                                <Translation
                                    id="TR_P2P_PRICE_TOOLTIP"
                                    values={{ symbol: assetCode }}
                                />
                            }
                            dashed
                        >
                            <Translation id="TR_P2P_PRICE" values={{ symbol: assetCode }} />
                        </Tooltip>
                    </MainHeading>
                    <MainValue>
                        <FiatAmountFormatter value={price} currency={currency} />
                    </MainValue>
                </MainColumn>
                <MainColumn>
                    <MainHeading>
                        <Tooltip
                            content={
                                <Translation
                                    id="TR_P2P_AMOUNT_RANGE_TOOLTIP"
                                    values={{ symbol: assetCode }}
                                />
                            }
                            dashed
                        >
                            <Translation id="TR_P2P_AMOUNT_RANGE" />
                        </Tooltip>
                    </MainHeading>
                    <MainValue>
                        <FiatAmountFormatter
                            value={amountRange.minimum}
                            currency={currency}
                            minimumFractionDigits={0}
                        />
                        &nbsp;–&nbsp;
                        <FiatAmountFormatter
                            value={amountRange.maximum}
                            currency={currency}
                            minimumFractionDigits={0}
                        />
                    </MainValue>
                </MainColumn>
                <MainColumnRight>
                    <StyledButton
                        isDisabled={!!quoteError}
                        onClick={() => {
                            selectQuote(quote);
                        }}
                    >
                        <Translation id="TR_P2P_GET_THIS_OFFER" />
                    </StyledButton>
                </MainColumnRight>
            </Main>
            <Details>
                <DetailColumn>
                    <DetailHeading>
                        <Translation id="TR_P2P_PROVIDER" />
                    </DetailHeading>
                    <DetailValue>
                        <CoinmarketProviderInfo providers={providers} exchange={provider} />
                    </DetailValue>
                </DetailColumn>
                <DetailColumn>
                    <DetailHeading>
                        <Tooltip content={<Translation id="TR_P2P_USER_TOOLTIP" />} dashed>
                            <Translation id="TR_P2P_USER" />
                        </Tooltip>
                    </DetailHeading>
                    <DetailValue>
                        <Avatar onlineStatus={trader.onlineStatus} />
                        <Name>{trader.name}</Name>
                        <Reputation>
                            <Translation
                                id="TR_P2P_USER_REPUTATION"
                                values={{
                                    rating: rating ? (
                                        <FormattedNumber value={rating} style="percent" />
                                    ) : (
                                        <Translation id="TR_P2P_UNKNOWN_RATING" />
                                    ),
                                    numberOfTrades: trader.numberOfTrades,
                                }}
                            />
                        </Reputation>
                    </DetailValue>
                </DetailColumn>
                <DetailColumn>
                    <DetailHeading>
                        <Translation id="TR_P2P_TITLE" />
                    </DetailHeading>
                    <DetailValue>
                        {title || (
                            <Translation
                                id="TR_P2P_TITLE_NOT_AVAILABLE"
                                values={{ providerName }}
                            />
                        )}
                    </DetailValue>
                </DetailColumn>
                <DetailColumn>
                    <DetailHeading>
                        <Translation id="TR_P2P_LOCATION" />
                    </DetailHeading>
                    <DetailValue>{location}</DetailValue>
                </DetailColumn>
                <DetailColumn>
                    <DetailHeading>
                        <Tooltip
                            content={<Translation id="TR_P2P_PAYMENT_METHODS_TOOLTIP" />}
                            dashed
                        >
                            <Translation id="TR_P2P_PAYMENT_METHODS" />
                        </Tooltip>
                    </DetailHeading>
                    <DetailValue>{paymentMethod}</DetailValue>
                </DetailColumn>
                <DetailColumn>
                    <DetailHeading>
                        <Tooltip
                            content={
                                <Translation
                                    id="TR_P2P_PAYMENT_WINDOW_TOOLTIP"
                                    values={{ providerName }}
                                />
                            }
                            dashed
                        >
                            <Translation id="TR_P2P_PAYMENT_WINDOW" />
                        </Tooltip>
                    </DetailHeading>
                    <DetailValue>
                        {paymentWindowMinutes}
                        &nbsp;
                        <Translation id="TR_P2P_PAYMENT_WINDOW_MINUTES" />
                    </DetailValue>
                </DetailColumn>
            </Details>
            {quoteError && (
                <ErrorFooter>
                    <IconWrapper>
                        <StyledIcon icon="CROSS" size={12} color={theme.TYPE_RED} />
                    </IconWrapper>
                    <ErrorText>{quoteError}</ErrorText>
                </ErrorFooter>
            )}
        </Wrapper>
    );
};
