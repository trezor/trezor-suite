import styled, { useTheme } from 'styled-components';
import { Badge, Button, Card, Row, Text } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { spacings, spacingsPx } from '@trezor/theme';
import { CoinmarketUtilsProvider } from '../CoinmarketUtils/CoinmarketUtilsProvider';
import { CoinmarketUtilsPrice } from '../CoinmarketUtils/CoinmarketUtilsPrice';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import {
    isCoinmarketExchangeOffers,
    isCoinmarketSellOffers,
    useCoinmarketOffersContext,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { CoinmarketTradeDetailMapProps } from 'src/types/coinmarket/coinmarket';
import {
    getCryptoQuoteAmountProps,
    getProvidersInfoProps,
    getSelectQuoteTyped,
} from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import { getTagAndInfoNote } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { SellFiatTrade } from 'invity-api';
import { CoinmarketUtilsKyc } from 'src/views/wallet/coinmarket/common/CoinmarketUtils/CoinmarketUtilsKyc';
import { CoinmarketTestWrapper } from 'src/views/wallet/coinmarket';

const Offer = styled.div`
    display: flex;
    min-height: 100px;

    ${SCREEN_QUERY.BELOW_DESKTOP} {
        flex-wrap: wrap;
    }
`;

const OfferColumn = styled.div`
    display: flex;
    flex-direction: column;
    flex: none;
`;

const ExchangeNameOfferColumn = styled(OfferColumn)`
    width: 27.3%;
    justify-content: center;

    ${SCREEN_QUERY.BELOW_DESKTOP} {
        width: 200px;
    }

    ${SCREEN_QUERY.BELOW_LAPTOP} {
        width: 100%;
    }
`;

const AmountOfferColumn = styled(OfferColumn)`
    width: 100%;
    flex: auto;
    justify-content: center;
    padding: 0 ${spacingsPx.md};

    ${SCREEN_QUERY.BELOW_DESKTOP} {
        width: calc(100% - 200px);
    }

    ${SCREEN_QUERY.BELOW_LAPTOP} {
        width: 100%;
        padding: ${spacingsPx.xs} 0 0 0;
    }
`;

const ActionsOfferColumn = styled(OfferColumn)`
    justify-content: center;

    ${SCREEN_QUERY.BELOW_DESKTOP} {
        align-items: flex-end;
        margin-top: ${spacingsPx.md};
        width: 100%;
    }
`;

const OfferProvider = styled(CoinmarketUtilsProvider)<{ $isMargined?: boolean }>`
    ${({ $isMargined }) => ($isMargined ? 'margin-top: auto;' : '')}
`;

const ButtonWrapper = styled.div`
    width: 180px;

    ${SCREEN_QUERY.BELOW_LAPTOP} {
        width: 100%;
    }
`;

export interface CoinmarketOffersItemProps {
    quote: CoinmarketTradeDetailMapProps[keyof CoinmarketTradeDetailMapProps];
    isBestRate: boolean;
}

export const CoinmarketOffersItem = ({ quote }: CoinmarketOffersItemProps) => {
    const theme = useTheme();
    const context = useCoinmarketOffersContext();
    const { callInProgress } = context;
    const providers = getProvidersInfoProps(context);
    const cryptoAmountProps = getCryptoQuoteAmountProps(quote, context);
    const { exchange } = quote;
    const { tag, infoNote } = getTagAndInfoNote(quote);
    const tagsExist = tag !== '';

    const selectQuote = getSelectQuoteTyped(context);

    if (!cryptoAmountProps) return null;

    return (
        <CoinmarketTestWrapper data-testid="@coinmarket/offers/quote">
            <Card margin={{ top: spacings.md }} minHeight={100}>
                <Offer>
                    <ExchangeNameOfferColumn>
                        {tagsExist && (
                            <Row alignItems="center" flexWrap="wrap" gap={spacings.xs}>
                                {tag && <Badge variant="tertiary">{tag}</Badge>}
                                {infoNote && (
                                    <Text typographyStyle="label" color={theme.textSubdued}>
                                        {infoNote}
                                    </Text>
                                )}
                            </Row>
                        )}
                        <OfferProvider
                            exchange={exchange}
                            providers={providers}
                            $isMargined={tagsExist}
                        />
                    </ExchangeNameOfferColumn>
                    <AmountOfferColumn>
                        <Row alignItems="flex-end">
                            <CoinmarketUtilsPrice {...cryptoAmountProps} />
                            {isCoinmarketExchangeOffers(context) && (
                                <CoinmarketUtilsKyc
                                    exchange={exchange}
                                    providers={context.exchangeInfo?.providerInfos}
                                    isForComparator
                                />
                            )}
                        </Row>
                    </AmountOfferColumn>
                    <ActionsOfferColumn>
                        <ButtonWrapper>
                            {quote.status === 'LOGIN_REQUEST' ? (
                                <Button isFullWidth onClick={() => selectQuote(quote)}>
                                    <Translation id="TR_LOGIN_PROCEED" />
                                </Button>
                            ) : (
                                <Button
                                    isFullWidth
                                    isLoading={callInProgress}
                                    isDisabled={!!quote.error || callInProgress}
                                    onClick={() => selectQuote(quote)}
                                    data-testid="@coinmarket/offers/get-this-deal-button"
                                >
                                    <Translation
                                        id={
                                            isCoinmarketSellOffers(context) &&
                                            context.needToRegisterOrVerifyBankAccount(
                                                quote as SellFiatTrade,
                                            )
                                                ? 'TR_SELL_REGISTER'
                                                : 'TR_COINMARKET_OFFERS_SELECT'
                                        }
                                    />
                                </Button>
                            )}
                        </ButtonWrapper>
                    </ActionsOfferColumn>
                </Offer>
            </Card>
        </CoinmarketTestWrapper>
    );
};
