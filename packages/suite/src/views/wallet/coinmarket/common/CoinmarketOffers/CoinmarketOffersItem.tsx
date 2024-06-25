import styled from 'styled-components';
import { Badge, Button, Card } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { spacings, spacingsPx, typography } from '@trezor/theme';
import { CoinmarketUtilsProvider } from '../CoinmarketUtils/CoinmarketUtilsProvider';
import CoinmarketUtilsPrice from '../CoinmarketUtils/CoinmarketUtilsPrice';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import {
    isCoinmarketSellOffers,
    useCoinmarketOffersContext,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { CoinmarketTradeDetailMapProps } from 'src/types/coinmarket/coinmarket';
import {
    getCryptoQuoteAmountProps,
    getProvidersInfoProps,
} from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import { getTagAndInfoNote } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { SellFiatTrade } from 'invity-api';

const OfferWrap = styled(Card)`
    min-height: 100px;
`;

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

const OfferColumn1 = styled(OfferColumn)`
    width: 27.3%;
    justify-content: center;

    ${SCREEN_QUERY.BELOW_DESKTOP} {
        width: 200px;
    }

    ${SCREEN_QUERY.BELOW_LAPTOP} {
        width: 100%;
    }
`;

const OfferColumn2 = styled(OfferColumn)`
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

const OfferColumn3 = styled(OfferColumn)`
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

const OfferBadgeWrap = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    flex-wrap: wrap;
`;

const OfferBadge = styled(Badge)`
    margin-right: ${spacingsPx.xs};
    margin-bottom: ${spacingsPx.xs};
`;

const OfferBadgeInfo = styled.div`
    ${typography.label};
    margin-bottom: ${spacingsPx.xs};
    padding: ${spacingsPx.xxxs} 0;
    color: ${({ theme }) => theme.textSubdued};
`;

const StyledButton = styled(Button)`
    width: 180px;

    ${SCREEN_QUERY.BELOW_LAPTOP} {
        width: 100%;
    }
`;

export interface CoinmarketOffersItemProps {
    quote: CoinmarketTradeDetailMapProps[keyof CoinmarketTradeDetailMapProps];
    isBestRate: boolean;
}

const CoinmarketOffersItem = ({ quote, isBestRate }: CoinmarketOffersItemProps) => {
    const context = useCoinmarketOffersContext();
    const { callInProgress, type } = context;
    const { providers } = getProvidersInfoProps(context);
    const cryptoAmountProps = getCryptoQuoteAmountProps(quote, context);
    const { exchange } = quote;
    const { tag, infoNote } = getTagAndInfoNote(quote);
    const tagsExist = tag !== '' || isBestRate;

    const selectQuote = context.selectQuote as (
        quote: CoinmarketTradeDetailMapProps[typeof type],
    ) => void;

    if (!cryptoAmountProps) return null;

    return (
        <OfferWrap margin={{ top: spacings.md }}>
            <Offer>
                <OfferColumn1>
                    {tagsExist && (
                        <OfferBadgeWrap>
                            {isBestRate && (
                                <OfferBadge variant="primary">
                                    <Translation id="TR_COINMARKET_BEST_RATE" />
                                </OfferBadge>
                            )}
                            {tag && <OfferBadge variant="tertiary">{tag}</OfferBadge>}
                            {infoNote && <OfferBadgeInfo>{infoNote}</OfferBadgeInfo>}
                        </OfferBadgeWrap>
                    )}
                    <OfferProvider
                        exchange={exchange}
                        providers={providers}
                        $isMargined={tagsExist}
                    />
                </OfferColumn1>
                <OfferColumn2>
                    <CoinmarketUtilsPrice {...cryptoAmountProps} />
                </OfferColumn2>
                <OfferColumn3>
                    {quote.status === 'LOGIN_REQUEST' ? (
                        <StyledButton onClick={() => selectQuote(quote)}>
                            <Translation id="TR_LOGIN_PROCEED" />
                        </StyledButton>
                    ) : (
                        <StyledButton
                            isLoading={callInProgress}
                            isDisabled={!!quote.error || callInProgress}
                            onClick={() => selectQuote(quote)}
                            data-test="@coinmarket/buy/offers/get-this-deal-button"
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
                        </StyledButton>
                    )}
                </OfferColumn3>
            </Offer>
        </OfferWrap>
    );
};

export default CoinmarketOffersItem;
