import { SellFiatTrade } from 'invity-api';
import styled, { useTheme } from 'styled-components';

import { TradingTradeMapProps, getTagAndInfoNote, sellUtils } from '@suite-common/trading';
import { Badge, Button, Card, Row, Text } from '@trezor/components';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { spacings, spacingsPx } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useTradingDeviceDisconnected } from 'src/hooks/wallet/trading/form/common/useTradingDeviceDisconnected';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    getCryptoQuoteAmountProps,
    getProvidersInfoProps,
    getSelectQuoteTyped,
    isTradingExchangeContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { TradingTestWrapper } from 'src/views/wallet/trading';
import { TradingUtilsKyc } from 'src/views/wallet/trading/common/TradingUtils/TradingUtilsKyc';
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
    const theme = useTheme();
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
        selectQuote(quote);
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
                        <Row alignItems="flex-end" data-testid="@trading/offer/amount">
                            <TradingUtilsPrice {...cryptoAmountProps} />

                            {isTradingExchangeContext(context) && (
                                <TradingUtilsKyc
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
