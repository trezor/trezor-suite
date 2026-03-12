import { BuyTrade, ExchangeTrade, SellFiatTrade } from 'invity-api';
import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import {
    TradingTradeMapProps,
    getTagAndInfoNote,
    sellUtils,
    tradingBuyActions,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';
import { Badge, Button, Card, Row, Text } from '@trezor/components';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { spacings, spacingsPx } from '@trezor/theme';

import { useDispatch } from 'src/hooks/suite';
import { useTradingDeviceDisconnected } from 'src/hooks/wallet/trading/form/common/useTradingDeviceDisconnected';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    getCryptoQuoteAmountProps,
    getProvidersInfoProps,
    getSelectQuoteTyped,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { TradingTestWrapper } from 'src/views/wallet/trading';
import { TradingUtilsPrice } from 'src/views/wallet/trading/common/TradingUtils/TradingUtilsPrice';
import { TradingUtilsProvider } from 'src/views/wallet/trading/common/TradingUtils/TradingUtilsProvider';

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

const OfferProvider = styled(TradingUtilsProvider)<{ $isMargined?: boolean }>`
    ${({ $isMargined }) => ($isMargined ? 'margin-top: auto;' : '')}
`;

const ButtonWrapper = styled.div`
    width: 180px;

    ${SCREEN_QUERY.BELOW_LAPTOP} {
        width: 100%;
    }
`;

export interface TradingOffersItemProps {
    quote: TradingTradeMapProps[keyof TradingTradeMapProps];
    isBestRate: boolean;
}

export const TradingOffersItem = ({ quote }: TradingOffersItemProps) => {
    const dispatch = useDispatch();
    const context = useTradingFormContext();
    const {
        form: {
            state: { isFormLoading },
        },
    } = context;
    const providers = getProvidersInfoProps(context);
    const cryptoAmountProps = getCryptoQuoteAmountProps(quote, context);
    const { exchange } = quote;
    const { tag, infoNote } = getTagAndInfoNote(quote);
    const tagsExist = tag !== '';

    const selectQuote = getSelectQuoteTyped(context);

    const { tradingDeviceDisconnected } = useTradingDeviceDisconnected();

    const onSelectQuote = () => {
        switch (context.type) {
            case 'exchange':
                dispatch(tradingExchangeActions.savePreselectedQuote(quote as ExchangeTrade));
                dispatch(goto({ routeName: 'wallet-trading-exchange' }));
                break;

            case 'buy':
                dispatch(tradingBuyActions.savePreselectedQuote(quote as BuyTrade));
                dispatch(goto({ routeName: 'wallet-trading-buy' }));
                break;

            case 'sell':
                dispatch(tradingSellActions.savePreselectedQuote(quote as SellFiatTrade));
                dispatch(goto({ routeName: 'wallet-trading-sell' }));
                break;
        }
    };

    const isSellVerificationRequired =
        isTradingSellContext(context) &&
        context.sellInfo &&
        sellUtils.needToRegisterOrVerifyBankAccount({
            quote: quote as SellFiatTrade,
            sellInfo: context.sellInfo,
        });

    if (!cryptoAmountProps) return null;

    return (
        <TradingTestWrapper
            data-testid="@trading/offers/quote"
            data-testid-alt={`@trading/offers/quote-${exchange}`}
        >
            <Card minHeight={100}>
                <Offer>
                    <ExchangeNameOfferColumn>
                        {tagsExist && (
                            <Row alignItems="center" flexWrap="wrap" gap={spacings.xs}>
                                {tag && <Badge intent="neutral">{tag}</Badge>}
                                {infoNote && (
                                    <Text
                                        typographyStyle="body-xs"
                                        intent="neutral"
                                        priority="secondary"
                                    >
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
                        <Row alignItems="flex-start" data-testid="@trading/offer/amount">
                            <TradingUtilsPrice {...cryptoAmountProps} quote={quote} />
                        </Row>
                    </AmountOfferColumn>
                    <ActionsOfferColumn>
                        <ButtonWrapper>
                            {quote.status === 'LOGIN_REQUEST' ? (
                                <Button width="100%" onClick={() => selectQuote(quote)}>
                                    <Translation id="TR_LOGIN_PROCEED" />
                                </Button>
                            ) : (
                                <Button
                                    width="100%"
                                    isLoading={isFormLoading}
                                    isDisabled={!!quote.error || tradingDeviceDisconnected}
                                    onClick={onSelectQuote}
                                    data-testid="@trading/offers/get-this-deal-button"
                                >
                                    <Translation
                                        id={
                                            isSellVerificationRequired
                                                ? 'TR_SELL_REGISTER'
                                                : 'TR_TRADING_OFFERS_SELECT'
                                        }
                                    />
                                </Button>
                            )}
                        </ButtonWrapper>
                    </ActionsOfferColumn>
                </Offer>
            </Card>
        </TradingTestWrapper>
    );
};
